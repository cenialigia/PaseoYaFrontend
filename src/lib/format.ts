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
