import type { Carrito } from '@/data/modelo';

// localStorage lo provee expo-sqlite (importado en src/lib/supabase.ts); persiste entre reinicios de la app.
const clave = (usuarioId: string) => `paseoya:carritos:v1:${usuarioId}`;

function esCarrito(x: unknown): x is Carrito {
  if (!x || typeof x !== 'object') return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.comercioId === 'string' &&
    typeof c.expiraEn === 'number' &&
    Array.isArray(c.lineas) &&
    c.lineas.every(
      (l: unknown) =>
        !!l &&
        typeof (l as Record<string, unknown>).productoId === 'string' &&
        Number.isInteger((l as Record<string, unknown>).cantidad) &&
        ((l as Record<string, unknown>).cantidad as number) > 0,
    )
  );
}

// Un dato dañado o de otra versión nunca rompe la app: se descarta y se empieza con carritos vacíos.
export function leerCarritos(usuarioId: string): Carrito[] {
  try {
    const crudo = localStorage.getItem(clave(usuarioId));
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    return Array.isArray(datos) ? datos.filter(esCarrito) : [];
  } catch {
    return [];
  }
}

export function guardarCarritos(usuarioId: string, carritos: Carrito[]): void {
  try {
    if (carritos.length === 0) localStorage.removeItem(clave(usuarioId));
    else localStorage.setItem(clave(usuarioId), JSON.stringify(carritos));
  } catch {
    // Sin almacenamiento disponible el carrito sigue funcionando en memoria.
  }
}
