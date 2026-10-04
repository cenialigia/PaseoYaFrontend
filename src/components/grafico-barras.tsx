import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { esVenta, type Pedido } from '@/data';
import { formatPrice } from '@/lib/format';

export type Barra = { etiqueta: string; valor: number };

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const inicioDelDia = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Ventas (pago hecho) por día en los últimos `dias` días, de más antiguo a hoy.
export function ventasPorDia(pedidos: Pedido[], dias: number, ahora: number): Barra[] {
  const hoy = inicioDelDia(ahora);
  return Array.from({ length: dias }, (_, i) => {
    const desde = hoy - (dias - 1 - i) * 86_400_000;
    const valor = pedidos.filter((p) => esVenta(p) && p.confirmadoEn >= desde && p.confirmadoEn < desde + 86_400_000).reduce((s, p) => s + p.total, 0);
    const d = new Date(desde);
    return { etiqueta: dias <= 7 ? DIAS[d.getDay()] : String(d.getDate()), valor };
  });
}

// Ventas de hoy en franjas de 2 horas, de 08:00 a 22:00 (horario del paseo).
export function ventasPorHora(pedidos: Pedido[], ahora: number): Barra[] {
  const hoy = inicioDelDia(ahora);
  return Array.from({ length: 7 }, (_, i) => {
    const h = 8 + i * 2;
    const desde = hoy + h * 3_600_000;
    const valor = pedidos.filter((p) => esVenta(p) && p.confirmadoEn >= desde && p.confirmadoEn < desde + 2 * 3_600_000).reduce((s, p) => s + p.total, 0);
    return { etiqueta: `${String(h).padStart(2, '0')}h`, valor };
  });
}

// Barras verticales simples con datos reales; el total y el máximo van escritos para lectores de pantalla.
export function GraficoBarras({ titulo, barras }: { titulo: string; barras: Barra[] }) {
  const max = Math.max(...barras.map((b) => b.valor), 0);
  const total = barras.reduce((s, b) => s + b.valor, 0);
  const mayor = barras.find((b) => b.valor === max && max > 0);
  const resumen = max > 0 ? `${titulo}: ${formatPrice(total)} en total; mayor ${mayor?.etiqueta} con ${formatPrice(max)}` : `${titulo}: sin ventas`;
  const muchas = barras.length > 10;
  return (
    <View style={styles.contenedor} accessible accessibilityLabel={resumen}>
      <AppText variant="label">{titulo}</AppText>
      <View style={styles.area}>
        {barras.map((b, i) => (
          <View key={`${b.etiqueta}-${i}`} style={styles.columna}>
            <View style={styles.pista}>
              <View style={[styles.barra, { height: `${max > 0 ? Math.max((b.valor / max) * 100, b.valor > 0 ? 4 : 0) : 0}%` }]} />
            </View>
            {!muchas || i % 5 === 0 || i === barras.length - 1 ? (
              <AppText variant="caption" color="onSurfaceVariant" numberOfLines={1}>
                {b.etiqueta}
              </AppText>
            ) : (
              <AppText variant="caption"> </AppText>
            )}
          </View>
        ))}
      </View>
      {max === 0 ? (
        <AppText variant="caption" color="onSurfaceVariant">
          Sin ventas en este periodo.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.sm },
  area: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 130 },
  columna: { flex: 1, alignItems: 'center', gap: 4 },
  pista: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  barra: { width: '100%', backgroundColor: Colors.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
});
