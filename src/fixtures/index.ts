// Datos 100 % ficticios (DEC-15). Única fuente de datos de la UI hasta INT-01.
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

export type Linea = { productoId: string; cantidad: number };

export type Carrito = { id: string; comercioId: string; lineas: Linea[]; expiraEn: number };

export type EstadoPedido =
  | 'CONFIRMED'
  | 'IN_PREPARATION'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED';

export type MetodoPago = 'QR_SIMULADO' | 'EFECTIVO';
export type EstadoPago = 'PENDING' | 'PAID' | 'REFUNDED';

export type Pedido = {
  id: string;
  codigo: string;
  comercioId: string;
  lineas: Linea[];
  estado: EstadoPedido;
  pago: { metodo: MetodoPago; estado: EstadoPago };
};

export const comercios: Comercio[] = [
  { id: 'com-techzone', nombre: 'TechZone', local: 'Local 208', piso: 'Planta baja', categoria: 'Tecnología', abierto: true },
  { id: 'com-moda', nombre: 'Boutique Aranjuez', local: 'Local 105', piso: 'Piso 1', categoria: 'Moda', abierto: true },
  { id: 'com-cafe', nombre: 'Café del Paseo', local: 'Local 012', piso: 'Planta baja', categoria: 'Gastronomía', abierto: false },
];

export const productos: Producto[] = [
  { id: 'prd-audifonos', comercioId: 'com-techzone', nombre: 'Audífonos inalámbricos', precio: 450, precioAnterior: 520, stock: 1 },
  { id: 'prd-cargador', comercioId: 'com-techzone', nombre: 'Cargador USB-C 30 W', precio: 120, stock: 14 },
  { id: 'prd-mouse', comercioId: 'com-techzone', nombre: 'Mouse ergonómico', precio: 180, stock: 0 },
  { id: 'prd-chaqueta', comercioId: 'com-moda', nombre: 'Chaqueta de mezclilla', precio: 380, stock: 6 },
  { id: 'prd-bufanda', comercioId: 'com-moda', nombre: 'Bufanda de alpaca', precio: 210, precioAnterior: 250, stock: 3 },
  { id: 'prd-cinturon', comercioId: 'com-moda', nombre: 'Cinturón de cuero', precio: 150, stock: 9 },
  { id: 'prd-cafe', comercioId: 'com-cafe', nombre: 'Café de altura 250 g', precio: 65, stock: 20 },
  { id: 'prd-saltenas', comercioId: 'com-cafe', nombre: 'Caja de 6 salteñas', precio: 72, stock: 8 },
  { id: 'prd-torta', comercioId: 'com-cafe', nombre: 'Porción de torta de chocolate', precio: 28, stock: 0 },
];

const MIN = 60_000;
const ahora = Date.now();

// Los plazos son ilustrativos: la regla de expiración espera DEC-06.
export const carritos: Carrito[] = [
  { id: 'car-techzone', comercioId: 'com-techzone', lineas: [{ productoId: 'prd-audifonos', cantidad: 1 }, { productoId: 'prd-cargador', cantidad: 2 }], expiraEn: ahora + 190 * MIN },
  { id: 'car-moda', comercioId: 'com-moda', lineas: [{ productoId: 'prd-bufanda', cantidad: 1 }], expiraEn: ahora + 25 * MIN },
  { id: 'car-cafe-vencido', comercioId: 'com-cafe', lineas: [{ productoId: 'prd-cafe', cantidad: 1 }], expiraEn: ahora - 5 * MIN },
];

export const pedidos: Pedido[] = [
  { id: 'ped-1001', codigo: 'PY-1001', comercioId: 'com-techzone', lineas: [{ productoId: 'prd-cargador', cantidad: 1 }], estado: 'CONFIRMED', pago: { metodo: 'EFECTIVO', estado: 'PENDING' } },
  { id: 'ped-1002', codigo: 'PY-1002', comercioId: 'com-moda', lineas: [{ productoId: 'prd-chaqueta', cantidad: 1 }], estado: 'IN_PREPARATION', pago: { metodo: 'QR_SIMULADO', estado: 'PAID' } },
  { id: 'ped-1003', codigo: 'PY-1003', comercioId: 'com-techzone', lineas: [{ productoId: 'prd-audifonos', cantidad: 1 }], estado: 'READY_FOR_PICKUP', pago: { metodo: 'QR_SIMULADO', estado: 'PAID' } },
  { id: 'ped-0990', codigo: 'PY-0990', comercioId: 'com-cafe', lineas: [{ productoId: 'prd-saltenas', cantidad: 2 }], estado: 'DELIVERED', pago: { metodo: 'EFECTIVO', estado: 'PAID' } },
  { id: 'ped-0985', codigo: 'PY-0985', comercioId: 'com-moda', lineas: [{ productoId: 'prd-cinturon', cantidad: 1 }], estado: 'CANCELLED', pago: { metodo: 'QR_SIMULADO', estado: 'REFUNDED' } },
  { id: 'ped-0970', codigo: 'PY-0970', comercioId: 'com-techzone', lineas: [{ productoId: 'prd-cargador', cantidad: 1 }], estado: 'EXPIRED', pago: { metodo: 'EFECTIVO', estado: 'PENDING' } },
];

// Credencial deliberadamente inválida: nunca debe parecer un formato aceptado por el backend.
export const credencialIlustrativa = { pin: '000000', qr: 'FIXTURE-NO-VALIDO' };

export function getComercio(id: string): Comercio | undefined {
  return comercios.find((c) => c.id === id);
}

export function getProducto(id: string): Producto | undefined {
  return productos.find((p) => p.id === id);
}

export function totalLineas(lineas: Linea[]): number {
  return lineas.reduce((sum, l) => sum + (getProducto(l.productoId)?.precio ?? 0) * l.cantidad, 0);
}

export const ESTADOS_EN_CURSO: EstadoPedido[] = ['CONFIRMED', 'IN_PREPARATION', 'READY_FOR_PICKUP'];

export const estadoPedidoUI: Record<EstadoPedido, { etiqueta: string; tono: StatusTone }> = {
  CONFIRMED: { etiqueta: 'Confirmado', tono: 'confirmado' },
  IN_PREPARATION: { etiqueta: 'En preparación', tono: 'preparando' },
  READY_FOR_PICKUP: { etiqueta: 'Listo para retiro', tono: 'listo' },
  DELIVERED: { etiqueta: 'Entregado', tono: 'entregado' },
  CANCELLED: { etiqueta: 'Cancelado', tono: 'cerrado' },
  EXPIRED: { etiqueta: 'Expirado', tono: 'cerrado' },
};

export function etiquetaPago(pago: Pedido['pago']): string {
  if (pago.estado === 'REFUNDED') return 'Reembolso simulado';
  if (pago.metodo === 'QR_SIMULADO') return pago.estado === 'PAID' ? 'Pago QR simulado confirmado' : 'QR de pago pendiente (simulado)';
  return pago.estado === 'PAID' ? 'Efectivo cobrado' : 'Efectivo al retirar';
}
