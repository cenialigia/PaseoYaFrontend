import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useCatalogo } from '@/data/catalogo';
import type { Carrito, EstadoPago, EstadoPedido, MetodoPago, Pedido } from '@/data/modelo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth';

export class CheckoutError extends Error {
  constructor(public motivo: 'red' | 'stock' | 'cerrado' | 'vencido') {
    super(motivo);
  }
}

export type Reporte = { id: string; pedidoId?: string; mensaje: string; creadoEn: number };

export type ResultadoValidacion = 'ok' | 'pin-incorrecto' | 'no-listo' | 'ajeno' | 'pago-pendiente' | 'red';

type CrearPedidoInput = { carrito: Carrito; metodo: MetodoPago; claveIdempotencia: string };

type OrdersContextValue = {
  pedidos: Pedido[];
  reportes: Reporte[];
  cargando: boolean;
  recargar: () => Promise<void>;
  crearPedido: (input: CrearPedidoInput) => Promise<Pedido>;
  simularPago: (pedidoId: string) => Promise<boolean>;
  cancelar: (pedidoId: string) => Promise<boolean>;
  avanzar: (pedidoId: string) => Promise<boolean>;
  confirmarEfectivo: (pedidoId: string) => Promise<boolean>;
  validarRetiro: (pedidoId: string, pin: string) => Promise<ResultadoValidacion>;
  reportar: (mensaje: string, pedidoId?: string) => Promise<boolean>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

type FilaPedido = {
  id: string;
  codigo: string;
  comercio_id: string;
  estado: EstadoPedido;
  metodo_pago: MetodoPago;
  estado_pago: EstadoPago;
  total: number | string;
  confirmado_en: string;
  vence_en: string;
  pedido_lineas: { producto_id: string; cantidad: number; precio_unitario: number | string }[];
};

function aPedido(f: FilaPedido, pines: Map<string, string>): Pedido {
  return {
    id: f.id,
    codigo: f.codigo,
    comercioId: f.comercio_id,
    estado: f.estado,
    pago: { metodo: f.metodo_pago, estado: f.estado_pago },
    total: Number(f.total),
    confirmadoEn: Date.parse(f.confirmado_en),
    venceEn: Date.parse(f.vence_en),
    lineas: f.pedido_lineas.map((l) => ({ productoId: l.producto_id, cantidad: l.cantidad, precioUnitario: Number(l.precio_unitario) })),
    pin: pines.get(f.id),
  };
}

const SELECT_PEDIDO = 'id, codigo, comercio_id, estado, metodo_pago, estado_pago, total, confirmado_en, vence_en, pedido_lineas(producto_id, cantidad, precio_unitario)';

type DatosPedidos = { pedidos: Pedido[]; reportes: Reporte[] };

// Lectura pura. RLS decide qué ve cada rol: el cliente sus pedidos, el comercio los suyos, el admin todos.
async function obtenerPedidos(rol: string): Promise<DatosPedidos | null> {
  const [p, c, r] = await Promise.all([
    supabase.from('pedidos').select(SELECT_PEDIDO).order('confirmado_en', { ascending: false }),
    // Sólo devuelve el PIN de pedidos propios en READY_FOR_PICKUP; para otros roles, vacío.
    supabase.from('credenciales_retiro').select('pedido_id, pin'),
    rol === 'ADMIN'
      ? supabase.from('reportes').select('id, pedido_id, mensaje, creado_en').order('creado_en', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (p.error) return null;
  const pines = new Map((c.data ?? []).map((x) => [x.pedido_id as string, x.pin as string]));
  return {
    pedidos: (p.data as FilaPedido[]).map((f) => aPedido(f, pines)),
    reportes: (r.data ?? []).map((x: { id: string; pedido_id: string | null; mensaje: string; creado_en: string }) => ({
      id: x.id,
      pedidoId: x.pedido_id ?? undefined,
      mensaje: x.mensaje,
      creadoEn: Date.parse(x.creado_en),
    })),
  };
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const { recargar: recargarCatalogo } = useCatalogo();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(false);

  const aplicar = useCallback((datos: DatosPedidos | null) => {
    setCargando(false);
    if (!datos) return;
    setPedidos(datos.pedidos);
    setReportes(datos.reportes);
  }, []);

  const recargar = useCallback(async () => {
    if (!usuario) return;
    setCargando(true);
    aplicar(await obtenerPedidos(usuario.rol));
  }, [usuario, aplicar]);

  useEffect(() => {
    if (!usuario) return;
    let activo = true;
    const refrescar = () => {
      obtenerPedidos(usuario.rol).then((datos) => {
        if (activo) aplicar(datos);
      });
    };
    refrescar();
    // Realtime sobre `pedidos` (respeta RLS): el panel del comercio y el cliente se actualizan solos.
    const canal = supabase
      .channel(`pedidos-${usuario.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, refrescar)
      .subscribe();
    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, [usuario, aplicar]);

  const rpc = async (fn: string, args: Record<string, unknown>) => {
    const { data, error } = await supabase.rpc(fn, args);
    if (!error) await recargar();
    return { data, error };
  };

  // BE-03: confirmar_pedido es idempotente por clave y aparta el stock de forma atómica (DEC-05).
  const crearPedido = async ({ carrito, metodo, claveIdempotencia }: CrearPedidoInput): Promise<Pedido> => {
    if (carrito.expiraEn <= Date.now()) throw new CheckoutError('vencido');
    const { data, error } = await supabase.rpc('confirmar_pedido', {
      p_comercio_id: carrito.comercioId,
      p_lineas: carrito.lineas.map((l) => ({ producto_id: l.productoId, cantidad: l.cantidad })),
      p_metodo: metodo,
      p_clave: claveIdempotencia,
    });
    if (error) {
      if (error.code === 'P0002') throw new CheckoutError('stock');
      if (error.code === 'P0001') throw new CheckoutError('cerrado');
      throw new CheckoutError('red');
    }
    await Promise.all([recargar(), recargarCatalogo()]);
    const f = data as Omit<FilaPedido, 'pedido_lineas'>;
    return aPedido({ ...f, pedido_lineas: carrito.lineas.map((l) => ({ producto_id: l.productoId, cantidad: l.cantidad, precio_unitario: 0 })) }, new Map());
  };

  const simularPago = async (pedidoId: string) => !(await rpc('simular_pago', { p_pedido: pedidoId })).error;

  const cancelar = async (pedidoId: string) => {
    const ok = !(await rpc('cancelar_pedido', { p_pedido: pedidoId })).error;
    if (ok) await recargarCatalogo();
    return ok;
  };

  const avanzar = async (pedidoId: string) => !(await rpc('avanzar_pedido', { p_pedido: pedidoId })).error;

  const confirmarEfectivo = async (pedidoId: string) => !(await rpc('confirmar_efectivo', { p_pedido: pedidoId })).error;

  const validarRetiro = async (pedidoId: string, pin: string): Promise<ResultadoValidacion> => {
    const { data, error } = await rpc('validar_retiro', { p_pedido: pedidoId, p_pin: pin.trim() });
    if (error) return 'red';
    return data as ResultadoValidacion;
  };

  const reportar = async (mensaje: string, pedidoId?: string) => {
    if (!usuario) return false;
    const { error } = await supabase.from('reportes').insert({ cliente_id: usuario.id, pedido_id: pedidoId ?? null, mensaje });
    return !error;
  };

  return (
    <OrdersContext.Provider
      value={{ pedidos, reportes, cargando, recargar, crearPedido, simularPago, cancelar, avanzar, confirmarEfectivo, validarRetiro, reportar }}>
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
  red: 'No se pudo confirmar por un problema de conexión. Puedes reintentar: no se creará un pedido duplicado.',
  stock: 'La disponibilidad cambió. Revisa tu carrito antes de continuar.',
  cerrado: 'La tienda está cerrada en este momento.',
  vencido: 'Tu carrito venció. Vuelve a agregar los productos.',
};

export const mensajeValidacion: Record<ResultadoValidacion, string> = {
  ok: 'Retiro validado. El pedido quedó como entregado.',
  'pin-incorrecto': 'El PIN no coincide. Verifique el código del cliente.',
  'no-listo': 'El pedido no está listo para retiro o ya fue entregado.',
  ajeno: 'Este pedido no pertenece a su comercio.',
  'pago-pendiente': 'El pago está pendiente. Confirme el efectivo o espere el pago simulado antes de entregar.',
  red: 'No se pudo conectar con el servidor. Intenta de nuevo.',
};
