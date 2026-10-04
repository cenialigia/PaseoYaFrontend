import type { Rol } from '@/state/auth';
import type { EstadoPromocion } from '@/data/catalogo-comercio';
import { supabase } from '@/lib/supabase';

// DEC-F14-06: operaciones del admin. RLS y las funciones del servidor vuelven a comprobar el rol en cada llamada.

// Usuarios ---------------------------------------------------------------------------
export type UsuarioAdmin = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  comercioId?: string;
  comercio?: string;
  activo: boolean;
  telefono?: string;
  creadoEn: number;
  ultimoAcceso?: number;
};

type FilaUsuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  comercio_id: string | null;
  comercio: string | null;
  activo: boolean;
  telefono: string | null;
  creado_en: string;
  ultimo_acceso: string | null;
};

export async function listarUsuarios(): Promise<UsuarioAdmin[] | null> {
  const { data, error } = await supabase.rpc('listar_usuarios');
  if (error) return null;
  return (data as FilaUsuario[]).map((u) => ({
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    comercioId: u.comercio_id ?? undefined,
    comercio: u.comercio ?? undefined,
    activo: u.activo,
    telefono: u.telefono ?? undefined,
    creadoEn: Date.parse(u.creado_en),
    ultimoAcceso: u.ultimo_acceso ? Date.parse(u.ultimo_acceso) : undefined,
  }));
}

export async function cambiarEstadoUsuario(id: string, activo: boolean): Promise<boolean> {
  const { error } = await supabase.rpc('cambiar_estado_usuario', { p_usuario: id, p_activo: activo });
  return !error;
}

export const etiquetaRol: Record<Rol, string> = { CLIENTE: 'Cliente', COMERCIO: 'Comercio', ADMIN: 'Administración' };

// Comercios ----------------------------------------------------------------------------
export type DatosComercioAdmin = { nombre: string; categoriaId: string; piso: string; local: string; descripcion?: string; horario?: string };

export async function crearComercio(d: DatosComercioAdmin & { email: string; password: string }): Promise<string | 'email-en-uso' | 'datos' | 'red'> {
  const { data, error } = await supabase.rpc('crear_comercio', {
    p_nombre: d.nombre,
    p_categoria: d.categoriaId,
    p_piso: d.piso,
    p_local: d.local,
    p_email: d.email,
    p_password: d.password,
  });
  if (error) return error.code === '23505' ? 'email-en-uso' : error.code === '22023' || error.code === '23514' ? 'datos' : 'red';
  return data as string;
}

export async function actualizarComercioAdmin(id: string, d: DatosComercioAdmin): Promise<boolean> {
  const { data, error } = await supabase
    .from('comercios')
    .update({
      nombre: d.nombre.trim(),
      categoria_id: d.categoriaId,
      piso: d.piso.trim(),
      local: d.local.trim(),
      descripcion: d.descripcion?.trim() || null,
      horario: d.horario?.trim() || null,
    })
    .eq('id', id)
    .select('id');
  return !error && data.length === 1;
}

export async function cambiarEstadoComercio(id: string, cambios: { abierto?: boolean; activo?: boolean }): Promise<boolean> {
  const { data, error } = await supabase.from('comercios').update(cambios).eq('id', id).select('id');
  return !error && data.length === 1;
}

// Categorías -----------------------------------------------------------------------------
export type CategoriaAdmin = { id: string; nombre: string; icono: string; orden: number; activa: boolean };

export async function listarCategoriasAdmin(): Promise<CategoriaAdmin[] | null> {
  const { data, error } = await supabase.from('categorias').select('id, nombre, icono, orden, activa').order('orden');
  return error ? null : (data as CategoriaAdmin[]);
}

export async function guardarCategoria(id: string | null, d: Omit<CategoriaAdmin, 'id'>): Promise<'ok' | 'duplicada' | 'red'> {
  const fila = { nombre: d.nombre.trim(), icono: d.icono, orden: d.orden, activa: d.activa };
  const { error } = id ? await supabase.from('categorias').update(fila).eq('id', id) : await supabase.from('categorias').insert(fila);
  if (!error) return 'ok';
  return error.code === '23505' ? 'duplicada' : 'red';
}

// Una categoría con comercios no se borra (clave foránea): se desactiva.
export async function eliminarCategoria(id: string): Promise<'ok' | 'con-comercios' | 'red'> {
  const { data, error } = await supabase.from('categorias').delete().eq('id', id).select('id');
  if (error) return error.code === '23503' ? 'con-comercios' : 'red';
  return data.length === 1 ? 'ok' : 'red';
}

// Promociones (DEC-F14-11) -------------------------------------------------------------
export type PromocionAdmin = {
  id: string;
  productoId: string;
  producto: string;
  comercioId: string;
  comercio: string;
  porcentaje: number;
  inicio: number;
  fin: number;
  estado: EstadoPromocion;
};

type FilaPromo = {
  id: string;
  producto_id: string;
  comercio_id: string;
  porcentaje: number;
  inicio: string;
  fin: string;
  estado: EstadoPromocion;
  productos: { nombre: string } | null;
  comercios: { nombre: string } | null;
};

export async function listarPromocionesAdmin(): Promise<PromocionAdmin[] | null> {
  const { data, error } = await supabase
    .from('promociones')
    .select('id, producto_id, comercio_id, porcentaje, inicio, fin, estado, productos(nombre), comercios(nombre)')
    .order('creado_en', { ascending: false });
  if (error) return null;
  return (data as unknown as FilaPromo[]).map((r) => ({
    id: r.id,
    productoId: r.producto_id,
    producto: r.productos?.nombre ?? '',
    comercioId: r.comercio_id,
    comercio: r.comercios?.nombre ?? '',
    porcentaje: r.porcentaje,
    inicio: Date.parse(r.inicio),
    fin: Date.parse(r.fin),
    estado: r.estado,
  }));
}

export async function cambiarEstadoPromocion(id: string, estado: EstadoPromocion): Promise<boolean> {
  const { data, error } = await supabase.from('promociones').update({ estado }).eq('id', id).select('id');
  return !error && data.length === 1;
}

// Las del admin nacen aprobadas; editar cambia el % o extiende la vigencia.
export async function guardarPromocionAdmin(id: string | null, productoId: string, porcentaje: number, finIso: string): Promise<boolean> {
  const { error } = id
    ? await supabase.from('promociones').update({ porcentaje, fin: finIso }).eq('id', id)
    : await supabase.from('promociones').insert({ producto_id: productoId, porcentaje, fin: finIso, estado: 'APROBADA' });
  return !error;
}

// Auditoría ------------------------------------------------------------------------------
export type RegistroAuditoria = { id: number; admin: string; tabla: string; accion: string; cambios: Record<string, unknown>; creadoEn: number };

export async function listarAuditoria(limite = 60): Promise<RegistroAuditoria[] | null> {
  const { data, error } = await supabase
    .from('auditoria_admin')
    .select('id, tabla, accion, cambios, creado_en, perfiles(nombre)')
    .order('creado_en', { ascending: false })
    .limit(limite);
  if (error) return null;
  return (data as unknown as { id: number; tabla: string; accion: string; cambios: Record<string, unknown>; creado_en: string; perfiles: { nombre: string } | null }[]).map(
    (r) => ({ id: r.id, admin: r.perfiles?.nombre ?? '', tabla: r.tabla, accion: r.accion, cambios: r.cambios, creadoEn: Date.parse(r.creado_en) }),
  );
}

export const nombreTabla: Record<string, string> = {
  comercios: 'Comercio',
  categorias: 'Categoría',
  promociones: 'Promoción',
  productos: 'Producto',
  perfiles: 'Usuario',
};

export const nombreAccion: Record<string, string> = { INSERT: 'Creó', UPDATE: 'Cambió', DELETE: 'Eliminó' };
