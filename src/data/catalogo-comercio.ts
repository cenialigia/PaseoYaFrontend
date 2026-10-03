import { supabase } from '@/lib/supabase';

// Producto tal como lo gestiona su comercio (incluye los desactivados, que el cliente no ve).
export type ProductoComercio = {
  id: string;
  nombre: string;
  precio: number;
  precioAnterior?: number;
  stock: number;
  activo: boolean;
};

export type DatosProducto = { nombre: string; precio: number; precioAnterior?: number; stock: number };

type Fila = { id: string; nombre: string; precio: number | string; precio_anterior: number | string | null; stock: number; activo: boolean };

const aProducto = (f: Fila): ProductoComercio => ({
  id: f.id,
  nombre: f.nombre,
  precio: Number(f.precio),
  precioAnterior: f.precio_anterior == null ? undefined : Number(f.precio_anterior),
  stock: f.stock,
  activo: f.activo,
});

const COLUMNAS = 'id, nombre, precio, precio_anterior, stock, activo';

// RLS limita lecturas y escrituras al comercio_id de la cuenta (DEC-10); el filtro sólo ordena la consulta.
export async function listarProductosComercio(comercioId: string): Promise<ProductoComercio[] | null> {
  const { data, error } = await supabase.from('productos').select(COLUMNAS).eq('comercio_id', comercioId).order('nombre');
  return error ? null : (data as Fila[]).map(aProducto);
}

export async function obtenerProductoComercio(id: string): Promise<ProductoComercio | null> {
  const { data, error } = await supabase.from('productos').select(COLUMNAS).eq('id', id).maybeSingle();
  return error || !data ? null : aProducto(data as Fila);
}

export type ErrorGuardado = 'datos' | 'stock-cambio' | 'red';

export async function crearProducto(comercioId: string, d: DatosProducto): Promise<ErrorGuardado | null> {
  const { error } = await supabase.from('productos').insert({
    comercio_id: comercioId,
    nombre: d.nombre,
    precio: d.precio,
    precio_anterior: d.precioAnterior ?? null,
    stock: d.stock,
  });
  if (!error) return null;
  return error.code === '23514' ? 'datos' : 'red';
}

// Concurrencia optimista: el stock sólo se escribe si sigue siendo el que el comercio vio al abrir el formulario,
// para no pisar una venta confirmada mientras tanto (confirmar_pedido descuenta stock).
export async function actualizarProducto(id: string, d: DatosProducto, stockLeido: number): Promise<ErrorGuardado | null> {
  const { data, error } = await supabase
    .from('productos')
    .update({ nombre: d.nombre, precio: d.precio, precio_anterior: d.precioAnterior ?? null, stock: d.stock })
    .eq('id', id)
    .eq('stock', stockLeido)
    .select('id');
  if (error) return error.code === '23514' ? 'datos' : 'red';
  return data.length === 0 ? 'stock-cambio' : null;
}

export async function cambiarActivo(id: string, activo: boolean): Promise<boolean> {
  const { error } = await supabase.from('productos').update({ activo }).eq('id', id);
  return !error;
}

export const mensajeGuardado: Record<ErrorGuardado, string> = {
  datos: 'El servidor rechazó los datos: el precio debe ser mayor que cero, el precio anterior mayor que el precio y el stock no negativo.',
  'stock-cambio': 'El stock cambió mientras editaba (por ejemplo, por una venta). Se recargó el valor actual: revíselo y guarde de nuevo.',
  red: 'No se pudo guardar. Revise la conexión e intente de nuevo.',
};

// Acepta «12,50» o «12.50».
export function leerNumero(texto: string): number | null {
  const t = texto.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Number(t);
}
