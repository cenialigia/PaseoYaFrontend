import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Categoria, Comercio, Linea, Producto, Promocion } from '@/data/modelo';
import { urlImagen } from '@/lib/imagenes';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth';

// Copia en memoria para los cálculos puros (carrito, totales) que no son componentes.
let cache: { comercios: Comercio[]; productos: Producto[] } = { comercios: [], productos: [] };

export function getComercio(id: string): Comercio | undefined {
  return cache.comercios.find((c) => c.id === id);
}

export function getProducto(id: string): Producto | undefined {
  return cache.productos.find((p) => p.id === id);
}

// En pedidos usa el precio congelado al confirmar; en carritos, el precio vigente.
export function totalLineas(lineas: Linea[]): number {
  return lineas.reduce((sum, l) => sum + (l.precioUnitario ?? getProducto(l.productoId)?.precio ?? 0) * l.cantidad, 0);
}

// Misma fórmula que public.precio_vigente: redondeo a 2 decimales para que el carrito coincida con lo cobrado.
export function aplicarDescuento(precio: number, porcentaje: number): number {
  return Math.round(precio * (100 - porcentaje)) / 100;
}

type Estado = {
  categorias: Categoria[];
  comercios: Comercio[];
  productos: Producto[];
  promociones: Promocion[];
  cargando: boolean;
  error: string | null;
};

const ERROR_CATALOGO = 'No se pudo cargar el catálogo. Revisa la conexión con el servidor.';
const VACIO: Omit<Estado, 'cargando' | 'error'> = { categorias: [], comercios: [], productos: [], promociones: [] };

type FilaComercio = {
  id: string;
  nombre: string;
  local: string;
  piso: string;
  categoria_id: string;
  abierto: boolean;
  descripcion: string | null;
  horario: string | null;
  imagen_path: string | null;
  categorias: { nombre: string } | null;
};
type FilaProducto = {
  id: string;
  comercio_id: string;
  nombre: string;
  precio: number | string;
  precio_anterior: number | string | null;
  stock: number;
  descripcion: string | null;
  imagen_path: string | null;
};

// Lectura pura bajo RLS: el cliente sólo recibe comercios/productos activos y promociones aprobadas y vigentes.
async function obtenerCatalogo(): Promise<Estado> {
  const ahora = new Date().toISOString();
  const [k, c, p, pm] = await Promise.all([
    supabase.from('categorias').select('id, nombre, icono').eq('activa', true).order('orden'),
    supabase.from('comercios').select('id, nombre, local, piso, categoria_id, abierto, descripcion, horario, imagen_path, categorias(nombre)').order('nombre'),
    supabase.from('productos').select('id, comercio_id, nombre, precio, precio_anterior, stock, descripcion, imagen_path').eq('activo', true).order('nombre'),
    supabase.from('promociones').select('id, producto_id, porcentaje, fin').eq('estado', 'APROBADA').lte('inicio', ahora).gte('fin', ahora),
  ]);
  if (k.error || c.error || p.error || pm.error) return { ...VACIO, cargando: false, error: ERROR_CATALOGO };

  const promociones: Promocion[] = pm.data.map((r) => ({ id: r.id, productoId: r.producto_id, porcentaje: r.porcentaje, fin: r.fin }));
  const mejor = new Map<string, number>();
  for (const x of promociones) mejor.set(x.productoId, Math.max(mejor.get(x.productoId) ?? 0, x.porcentaje));

  const comercios: Comercio[] = (c.data as unknown as FilaComercio[]).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    local: r.local,
    piso: r.piso,
    categoriaId: r.categoria_id,
    categoria: r.categorias?.nombre ?? '',
    abierto: r.abierto,
    descripcion: r.descripcion ?? undefined,
    horario: r.horario ?? undefined,
    imagenUrl: urlImagen(r.imagen_path),
  }));
  const productos: Producto[] = (p.data as FilaProducto[]).map((r) => {
    const base = Number(r.precio);
    const pct = mejor.get(r.id);
    return {
      id: r.id,
      comercioId: r.comercio_id,
      nombre: r.nombre,
      precio: pct ? aplicarDescuento(base, pct) : base,
      precioAnterior: pct ? base : r.precio_anterior == null ? undefined : Number(r.precio_anterior),
      descuento: pct,
      stock: r.stock,
      descripcion: r.descripcion ?? undefined,
      imagenUrl: urlImagen(r.imagen_path),
    };
  });
  return { categorias: k.data, comercios, productos, promociones, cargando: false, error: null };
}

type CatalogoValue = Estado & { recargar: () => Promise<void> };

const CatalogoContext = createContext<CatalogoValue | null>(null);

// Se monta con key por usuario: al cambiar de sesión empieza de cero.
export function CatalogoProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState<Estado>({ ...VACIO, cargando: !!usuario, error: null });

  const aplicar = useCallback((nuevo: Estado) => {
    if (!nuevo.error) cache = { comercios: nuevo.comercios, productos: nuevo.productos };
    setEstado((e) => (nuevo.error ? { ...e, cargando: false, error: nuevo.error } : nuevo));
  }, []);

  const recargar = useCallback(async () => {
    setEstado((e) => ({ ...e, cargando: true, error: null }));
    aplicar(await obtenerCatalogo());
  }, [aplicar]);

  useEffect(() => {
    if (!usuario) {
      cache = { comercios: [], productos: [] };
      return;
    }
    let activo = true;
    obtenerCatalogo().then((nuevo) => {
      if (activo) aplicar(nuevo);
    });
    return () => {
      activo = false;
    };
  }, [usuario, aplicar]);

  return <CatalogoContext.Provider value={{ ...estado, recargar }}>{children}</CatalogoContext.Provider>;
}

export function useCatalogo(): CatalogoValue & { getComercio: typeof getComercio; getProducto: typeof getProducto } {
  const ctx = useContext(CatalogoContext);
  if (!ctx) throw new Error('useCatalogo debe usarse dentro de CatalogoProvider');
  return { ...ctx, getComercio, getProducto };
}
