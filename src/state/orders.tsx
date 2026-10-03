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

type CrearPedidoInput = { carrito: Carrito; metodo: MetodoPago; claveIdempotencia: string; fallo?: FalloSimulado };

type OrdersContextValue = {
  pedidos: Pedido[];
  crearPedido: (input: CrearPedidoInput) => Promise<Pedido>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);
const LATENCIA_MS = 1200;

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales);
  // Simula el registro de claves de idempotencia que en el backend vivirá en PostgreSQL (BE-03).
  const porClave = useRef(new Map<string, Pedido>());
  const siguiente = useRef(1004);

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
        };
        porClave.current.set(claveIdempotencia, pedido);
        setPedidos((ps) => [pedido, ...ps]);
        if (fallo === 'despues') return reject(new CheckoutError('red'));
        resolve(pedido);
      }, LATENCIA_MS);
    });

  return <OrdersContext.Provider value={{ pedidos, crearPedido }}>{children}</OrdersContext.Provider>;
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
