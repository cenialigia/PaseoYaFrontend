const currency = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });

export function formatPrice(amount: number): string {
  return currency.format(amount);
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Vencido';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

// Sin depender de String.normalize, que en Hermes/Android no descompone las tildes.
const ACCENTS: Record<string, string> = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n' };

export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áéíóúüñ]/g, (c) => ACCENTS[c])
    .trim();
}

// «DD/MM/AAAA» → fecha ISO y edad; null si la fecha no existe (p. ej. 31/02).
export function leerFecha(texto: string): { iso: string; edad: number } | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(Date.UTC(a, mes - 1, d));
  if (fecha.getUTCDate() !== d || fecha.getUTCMonth() !== mes - 1 || a < 1900) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - a;
  if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < d)) edad -= 1;
  if (edad < 0) return null;
  return { iso: `${m[3]}-${m[2]}-${m[1]}`, edad };
}

export function isoADma(iso?: string): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function haceCuanto(ms: number, ahora = Date.now()): string {
  const min = Math.floor((ahora - ms) / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? 'Hace 1 hora' : `Hace ${h} horas`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Hace 1 día' : `Hace ${d} días`;
}

export function formatFechaHora(ms: number): string {
  const f = new Date(ms);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()} · ${dos(f.getHours())}:${dos(f.getMinutes())}`;
}

// Base64 → bytes, sin depender de atob (no siempre disponible en Hermes). Se usa para subir imágenes a Storage.
export function base64ABytes(b64: string): Uint8Array {
  const tabla = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const limpio = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((limpio.length * 3) / 4));
  let j = 0;
  for (let i = 0; i < limpio.length; i += 4) {
    const n = (tabla.indexOf(limpio[i]) << 18) | (tabla.indexOf(limpio[i + 1]) << 12) | ((tabla.indexOf(limpio[i + 2]) & 63) << 6) | (tabla.indexOf(limpio[i + 3]) & 63);
    bytes[j++] = (n >> 16) & 255;
    if (limpio[i + 2] !== undefined) bytes[j++] = (n >> 8) & 255;
    if (limpio[i + 3] !== undefined) bytes[j++] = n & 255;
  }
  return bytes.subarray(0, j);
}
