import { urlImagen } from '@/lib/imagenes';
import { supabase } from '@/lib/supabase';

// Producto tal como lo gestiona su comercio (incluye los desactivados, que el cliente no ve).
export type ProductoComercio = {
  id: string;
  nombre: string;
  precio: number;
  precioAnterior?: number;
  stock: number;
  activo: boolean;
  descripcion?: string;
  imagenPath?: string;
  imagenUrl?: string;
};

export type DatosProducto = { nombre: string; precio: number; precioAnterior?: number; stock: number; descripcion?: string; imagenPath?: string };

type Fila = {
  id: string;
  nombre: string;
  precio: number | string;
  precio_anterior: number | string | null;
  stock: number;
  activo: boolean;
  descripcion: string | null;
  imagen_path: string | null;
};

const aProducto = (f: Fila): ProductoComercio => ({
  id: f.id,
  nombre: f.nombre,
  precio: Number(f.precio),
  precioAnterior: f.precio_anterior == null ? undefined : Number(f.precio_anterior),
  stock: f.stock,
  activo: f.activo,
  descripcion: f.descripcion ?? undefined,
  imagenPath: f.imagen_path ?? undefined,
  imagenUrl: urlImagen(f.imagen_path),
});

const COLUMNAS = 'id, nombre, precio, precio_anterior, stock, activo, descripcion, imagen_path';

const aFila = (d: DatosProducto) => ({
  nombre: d.nombre,
  precio: d.precio,
  precio_anterior: d.precioAnterior ?? null,
  stock: d.stock,
  descripcion: d.descripcion?.trim() || null,
  imagen_path: d.imagenPath ?? null,
});

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
  const { error } = await supabase.from('productos').insert({ comercio_id: comercioId, ...aFila(d) });
  if (!error) return null;
  return error.code === '23514' ? 'datos' : 'red';
}

// Concurrencia optimista: el stock sólo se escribe si sigue siendo el que el comercio vio al abrir el formulario,
// para no pisar una venta confirmada mientras tanto (confirmar_pedido descuenta stock).
export async function actualizarProducto(id: string, d: DatosProducto, stockLeido: number): Promise<ErrorGuardado | null> {
  const { data, error } = await supabase.from('productos').update(aFila(d)).eq('id', id).eq('stock', stockLeido).select('id');
  if (error) return error.code === '23514' ? 'datos' : 'red';
  return data.length === 0 ? 'stock-cambio' : null;
}

export async function cambiarActivo(id: string, activo: boolean): Promise<boolean> {
  const { error } = await supabase.from('productos').update({ activo }).eq('id', id);
  return !error;
}

// DEC-F14-07: un producto con pedidos sólo se desactiva; la clave foránea de pedido_lineas impide borrarlo.
// Al borrarlo también se retira su foto del bucket, para no dejar archivos huérfanos.
export async function eliminarProducto(id: string, imagenPath?: string): Promise<'ok' | 'con-pedidos' | 'red'> {
  const { data, error } = await supabase.from('productos').delete().eq('id', id).select('id');
  if (error) return error.code === '23503' ? 'con-pedidos' : 'red';
  if (data.length !== 1) return 'red';
  if (imagenPath) await supabase.storage.from('imagenes').remove([imagenPath]);
  return 'ok';
}

export const mensajeGuardado: Record<ErrorGuardado, string> = {
  datos: 'El servidor rechazó los datos: el precio debe ser mayor que cero, el precio anterior mayor que el precio y el stock no negativo.',
  'stock-cambio': 'El stock cambió mientras editabas (por ejemplo, por una venta). Se cargó el valor actual: revísalo y guarda de nuevo.',
  red: 'No se pudo guardar. Revisa la conexión e intenta de nuevo.',
};

// Acepta «12,50» o «12.50».
export function leerNumero(texto: string): number | null {
  const t = texto.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Number(t);
}

// Promociones del comercio (DEC-F14-11): sólo % y con vigencia; el servidor las deja PENDIENTE hasta que el admin apruebe.
export type EstadoPromocion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'PAUSADA';
export type PromocionComercio = { id: string; productoId: string; producto: string; porcentaje: number; inicio: number; fin: number; estado: EstadoPromocion };

// RLS también deja ver las promociones aprobadas de otros comercios: se filtra por el propio.
export async function listarPromocionesComercio(comercioId: string): Promise<PromocionComercio[] | null> {
  const { data, error } = await supabase
    .from('promociones')
    .select('id, producto_id, porcentaje, inicio, fin, estado, productos(nombre)')
    .eq('comercio_id', comercioId)
    .order('creado_en', { ascending: false });
  if (error) return null;
  return (data as unknown as { id: string; producto_id: string; porcentaje: number; inicio: string; fin: string; estado: EstadoPromocion; productos: { nombre: string } | null }[]).map(
    (r) => ({
      id: r.id,
      productoId: r.producto_id,
      producto: r.productos?.nombre ?? '',
      porcentaje: r.porcentaje,
      inicio: Date.parse(r.inicio),
      fin: Date.parse(r.fin),
      estado: r.estado,
    }),
  );
}

export async function crearPromocion(productoId: string, porcentaje: number, dias: number): Promise<boolean> {
  const fin = new Date(Date.now() + dias * 86_400_000).toISOString();
  const { error } = await supabase.from('promociones').insert({ producto_id: productoId, porcentaje, fin });
  return !error;
}

export async function pausarPromocion(id: string): Promise<boolean> {
  const { error } = await supabase.from('promociones').update({ estado: 'PAUSADA' }).eq('id', id);
  return !error;
}

export const etiquetaPromocion: Record<EstadoPromocion, { texto: string; tono: 'confirmado' | 'listo' | 'cerrado' | 'entregado' }> = {
  PENDIENTE: { texto: 'En revisión', tono: 'confirmado' },
  APROBADA: { texto: 'Aprobada', tono: 'listo' },
  RECHAZADA: { texto: 'Rechazada', tono: 'cerrado' },
  PAUSADA: { texto: 'Pausada', tono: 'entregado' },
};

// Establecimiento (DEC-F14-07): el comercio edita descripción, horario, foto y abierto/cerrado.
export type DatosComercio = { descripcion?: string; horario?: string; abierto: boolean; imagenPath?: string };

export async function obtenerImagenComercio(id: string): Promise<string | undefined> {
  const { data } = await supabase.from('comercios').select('imagen_path').eq('id', id).maybeSingle();
  return data?.imagen_path ?? undefined;
}

export async function actualizarComercio(id: string, d: DatosComercio): Promise<boolean> {
  const { data, error } = await supabase
    .from('comercios')
    .update({ descripcion: d.descripcion?.trim() || null, horario: d.horario?.trim() || null, abierto: d.abierto, imagen_path: d.imagenPath ?? null })
    .eq('id', id)
    .select('id');
  return !error && data.length === 1;
}

export async function cambiarAbierto(id: string, abierto: boolean): Promise<boolean> {
  const { data, error } = await supabase.from('comercios').update({ abierto }).eq('id', id).select('id');
  return !error && data.length === 1;
}
