import { createContext, useContext, useRef, useState, type ReactNode } from 'react';

import { getComercio, getProducto, pedidos as pedidosIniciales, type Carrito, type MetodoPago, type Pedido } from '@/fixtures';

// Fallo simulado sólo en desarrollo para probar error y reintento:
// 'antes' = no se crea el pedido; 'despues' = se crea pero la respuesta se pierde.
export type FalloSimulado = 'ninguno' | 'antes' | 'despues';

export class CheckoutError extends Error {
  constructor(public motivo: 'red' | 'stock' | 'cerrado' | 'vencido') {
    super(motivo);
  }
}

export type Reporte = { id: string; pedidoId?: string; mensaje: string; creadoEn: number };

export type ResultadoValidacion = 'ok' | 'pin-incorrecto' | 'no-listo' | 'ajeno' | 'pago-pendiente';

type CrearPedidoInput = { carrito: Carrito; metodo: MetodoPago; claveIdempotencia: string; fallo?: FalloSimulado };

type OrdersContextValue = {
  pedidos: Pedido[];
  reportes: Reporte[];
  crearPedido: (input: CrearPedidoInput) => Promise<Pedido>;
  simularPago: (pedidoId: string) => void;
  cancelar: (pedidoId: string) => boolean;
  iniciarPreparacion: (pedidoId: string, comercioId: string) => void;
  marcarListo: (pedidoId: string, comercioId: string) => void;
  confirmarEfectivo: (pedidoId: string, comercioId: string) => void;
  validarRetiro: (pedidoId: string, comercioId: string, pin: string) => ResultadoValidacion;
  reportar: (mensaje: string, pedidoId?: string) => void;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);
const LATENCIA_MS = 1200;

// PIN ilustrativo generado en el cliente; en el backend lo emitirá una función confiable (BE-04).
function nuevoPin(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>(() => pedidosIniciales.map((p) => ({ ...p, pin: nuevoPin() })));
  const [reportes, setReportes] = useState<Reporte[]>([]);
  // Simula el registro de claves de idempotencia que en el backend vivirá en PostgreSQL (BE-03).
  const porClave = useRef(new Map<string, Pedido>());
  const siguiente = useRef(1004);

  const actualizar = (pedidoId: string, cambio: (p: Pedido) => Pedido | null) =>
    setPedidos((ps) => ps.map((p) => (p.id === pedidoId ? (cambio(p) ?? p) : p)));

  const crearPedido = ({ carrito, metodo, claveIdempotencia, fallo = 'ninguno' }: CrearPedidoInput) =>
    new Promise<Pedido>((resolve, reject) => {
      setTimeout(() => {
        const previo = porClave.current.get(claveIdempotencia);
        if (previo) return resolve(previo);
        if (fallo === 'antes') return reject(new CheckoutError('red'));
        if (carrito.expiraEn <= Date.now()) return reject(new CheckoutError('vencido'));
        if (!getComercio(carrito.comercioId)?.abierto) return reject(new CheckoutError('cerrado'));
        const sinStock = carrito.lineas.some((l) => l.cantidad > (getProducto(l.productoId)?.stock ?? 0));
        if (sinStock) return reject(new CheckoutError('stock'));

        // Sin `++` sobre el ref: con React Compiler el incremento sufijo devolvía el valor ya incrementado.
        const numero = siguiente.current;
        siguiente.current = numero + 1;
        const pedido: Pedido = {
          id: `ped-${numero}`,
          codigo: `PY-${numero}`,
          comercioId: carrito.comercioId,
          lineas: carrito.lineas.map((l) => ({ ...l })),
          estado: 'CONFIRMED',
          pago: { metodo, estado: 'PENDING' },
          pin: nuevoPin(),
        };
        porClave.current.set(claveIdempotencia, pedido);
        setPedidos((ps) => [pedido, ...ps]);
        if (fallo === 'despues') return reject(new CheckoutError('red'));
        resolve(pedido);
      }, LATENCIA_MS);
    });

  // DEC-04: sólo simula; no hay cobro real.
  const simularPago = (pedidoId: string) =>
    actualizar(pedidoId, (p) =>
      p.pago.metodo === 'QR_SIMULADO' && p.pago.estado === 'PENDING' && p.estado !== 'CANCELLED' && p.estado !== 'EXPIRED'
        ? { ...p, pago: { ...p.pago, estado: 'PAID' } }
        : null,
    );

  // DEC-08: el cliente sólo cancela en Confirmado; un QR simulado pagado pasa a reembolso simulado.
  const cancelar = (pedidoId: string) => {
    const p = pedidos.find((x) => x.id === pedidoId);
    if (!p || p.estado !== 'CONFIRMED') return false;
    actualizar(pedidoId, (x) => ({
      ...x,
      estado: 'CANCELLED',
      pago: x.pago.estado === 'PAID' && x.pago.metodo === 'QR_SIMULADO' ? { ...x.pago, estado: 'REFUNDED' } : x.pago,
    }));
    return true;
  };

  // Las acciones del comercio comprueban que el pedido sea suyo; en el backend lo impone RLS.
  const deComercio = (p: Pedido, comercioId: string) => p.comercioId === comercioId;

  const iniciarPreparacion = (pedidoId: string, comercioId: string) =>
    actualizar(pedidoId, (p) => (deComercio(p, comercioId) && p.estado === 'CONFIRMED' ? { ...p, estado: 'IN_PREPARATION' } : null));

  const marcarListo = (pedidoId: string, comercioId: string) =>
    actualizar(pedidoId, (p) => (deComercio(p, comercioId) && p.estado === 'IN_PREPARATION' ? { ...p, estado: 'READY_FOR_PICKUP' } : null));

  const confirmarEfectivo = (pedidoId: string, comercioId: string) =>
    actualizar(pedidoId, (p) =>
      deComercio(p, comercioId) && p.pago.metodo === 'EFECTIVO' && p.pago.estado === 'PENDING' && p.estado === 'READY_FOR_PICKUP'
        ? { ...p, pago: { ...p.pago, estado: 'PAID' } }
        : null,
    );

  // DEC-16: un solo uso; sólo el comercio dueño y sólo en Listo para retiro.
  const validarRetiro = (pedidoId: string, comercioId: string, pin: string): ResultadoValidacion => {
    const p = pedidos.find((x) => x.id === pedidoId);
    if (!p || !deComercio(p, comercioId)) return 'ajeno';
    if (p.estado !== 'READY_FOR_PICKUP') return 'no-listo';
    if (p.pin !== pin.trim()) return 'pin-incorrecto';
    // No se entrega un pedido sin pago: efectivo confirmado por el comercio o QR simulado pagado.
    if (p.pago.estado !== 'PAID') return 'pago-pendiente';
    actualizar(pedidoId, (x) => ({ ...x, estado: 'DELIVERED' }));
    return 'ok';
  };

  const reportar = (mensaje: string, pedidoId?: string) =>
    setReportes((rs) => [{ id: `rep-${rs.length + 1}`, pedidoId, mensaje, creadoEn: Date.now() }, ...rs]);

  return (
    <OrdersContext.Provider
      value={{ pedidos, reportes, crearPedido, simularPago, cancelar, iniciarPreparacion, marcarListo, confirmarEfectivo, validarRetiro, reportar }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders debe usarse dentro de OrdersProvider');
  return ctx;
}

export const mensajeCheckoutError: Record<CheckoutError['motivo'], string> = {
  red: 'No se pudo confirmar por un problema de conexión. Puede reintentar: no se creará un pedido duplicado.',
  stock: 'La disponibilidad cambió. Revise su carrito antes de continuar.',
  cerrado: 'El comercio está cerrado en este momento.',
  vencido: 'Su carrito venció. Vuelva a agregar los productos.',
};

export const mensajeValidacion: Record<ResultadoValidacion, string> = {
  ok: 'Retiro validado. El pedido quedó como entregado.',
  'pin-incorrecto': 'El PIN no coincide. Verifique el código del cliente.',
  'no-listo': 'El pedido no está listo para retiro o ya fue entregado.',
  ajeno: 'Este pedido no pertenece a su comercio.',
  'pago-pendiente': 'El pago está pendiente. Confirme el efectivo o espere el pago simulado antes de entregar.',
};
