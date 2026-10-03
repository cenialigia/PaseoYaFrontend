import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Comercio, Linea, Producto } from '@/data/modelo';
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

// En pedidos usa el precio congelado al confirmar; en carritos, el precio actual.
export function totalLineas(lineas: Linea[]): number {
  return lineas.reduce((sum, l) => sum + (l.precioUnitario ?? getProducto(l.productoId)?.precio ?? 0) * l.cantidad, 0);
}

type Estado = { comercios: Comercio[]; productos: Producto[]; cargando: boolean; error: string | null };

const ERROR_CATALOGO = 'No se pudo cargar el catálogo. Revise la conexión con el servidor.';

// Lectura pura: RLS exige sesión para ver comercios y productos.
async function obtenerCatalogo(): Promise<Estado> {
  const [c, p] = await Promise.all([
    supabase.from('comercios').select('id, nombre, local, piso, categoria, abierto').order('nombre'),
    supabase.from('productos').select('id, comercio_id, nombre, precio, precio_anterior, stock').eq('activo', true).order('nombre'),
  ]);
  if (c.error || p.error) return { comercios: [], productos: [], cargando: false, error: ERROR_CATALOGO };
  const productos: Producto[] = p.data.map((r) => ({
    id: r.id,
    comercioId: r.comercio_id,
    nombre: r.nombre,
    precio: Number(r.precio),
    precioAnterior: r.precio_anterior == null ? undefined : Number(r.precio_anterior),
    stock: r.stock,
  }));
  return { comercios: c.data, productos, cargando: false, error: null };
}

type CatalogoValue = Estado & { recargar: () => Promise<void> };

const CatalogoContext = createContext<CatalogoValue | null>(null);

// Se monta con key por usuario: al cambiar de sesión empieza de cero.
export function CatalogoProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState<Estado>({ comercios: [], productos: [], cargando: !!usuario, error: null });

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
