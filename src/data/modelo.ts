import type { StatusTone } from '@/constants/theme';

export type Comercio = {
  id: string;
  nombre: string;
  local: string;
  piso: string;
  categoria: string;
  abierto: boolean;
};

export type Producto = {
  id: string;
  comercioId: string;
  nombre: string;
  precio: number;
  precioAnterior?: number;
  stock: number;
};

// precioUnitario sólo existe en pedidos (precio congelado al confirmar).
export type Linea = { productoId: string; cantidad: number; precioUnitario?: number };

export type Carrito = { id: string; comercioId: string; lineas: Linea[]; expiraEn: number };

export type EstadoPedido = 'CONFIRMED' | 'IN_PREPARATION' | 'READY_FOR_PICKUP' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED';
export type MetodoPago = 'QR_SIMULADO' | 'EFECTIVO';
export type EstadoPago = 'PENDING' | 'PAID' | 'REFUNDED' | 'RETAINED';

export type Pedido = {
  id: string;
  codigo: string;
  comercioId: string;
  lineas: Linea[];
  estado: EstadoPedido;
  pago: { metodo: MetodoPago; estado: EstadoPago };
  total: number;
  // PIN de retiro (DEC-16): RLS sólo lo entrega al cliente dueño en READY_FOR_PICKUP.
  pin?: string;
};

export const ESTADOS_EN_CURSO: EstadoPedido[] = ['CONFIRMED', 'IN_PREPARATION', 'READY_FOR_PICKUP'];

export const estadoPedidoUI: Record<EstadoPedido, { etiqueta: string; tono: StatusTone }> = {
  CONFIRMED: { etiqueta: 'Confirmado', tono: 'confirmado' },
  IN_PREPARATION: { etiqueta: 'En preparación', tono: 'preparando' },
  READY_FOR_PICKUP: { etiqueta: 'Listo para retiro', tono: 'listo' },
  DELIVERED: { etiqueta: 'Entregado', tono: 'entregado' },
  CANCELLED: { etiqueta: 'Cancelado', tono: 'cerrado' },
  EXPIRED: { etiqueta: 'Expirado', tono: 'cerrado' },
};

export function etiquetaPago(pedido: Pick<Pedido, 'pago' | 'estado'>): string {
  const { pago, estado } = pedido;
  if (pago.estado === 'REFUNDED') return 'Reembolso simulado';
  // DEC-07: un QR simulado pagado y no retirado queda retenido por el comercio.
  if (pago.estado === 'RETAINED') return 'Pago simulado retenido por el comercio';
  if (estado === 'EXPIRED') return 'Reserva vencida sin pago';
  if (pago.metodo === 'QR_SIMULADO') return pago.estado === 'PAID' ? 'Pago QR simulado confirmado' : 'QR de pago pendiente (simulado)';
  return pago.estado === 'PAID' ? 'Efectivo cobrado' : 'Efectivo al retirar';
}
