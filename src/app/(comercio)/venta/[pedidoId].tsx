import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { nombreLinea } from '@/components/pedido-comercio-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { estadoPedidoUI, etiquetaPago } from '@/data';
import { formatFechaHora, formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

// COM-10 · Detalle de venta: pedido, productos con su precio congelado, método y pago. Nunca muestra el PIN del cliente.
export default function VentaDetalle() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const pedido = useOrders().pedidos.find((p) => p.id === pedidoId);
  if (!pedido) return <ErrorState title="Venta no encontrada" actionLabel="Volver a ventas" onAction={() => router.navigate('/ventas')} />;
  const estado = estadoPedidoUI[pedido.estado];

  return (
    <Screen>
      <View style={styles.cabecera}>
        <View style={styles.flex}>
          <AppText variant="headline">{pedido.codigo}</AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {formatFechaHora(pedido.confirmadoEn)}
          </AppText>
        </View>
        <StatusChip label={estado.etiqueta} tone={estado.tono} />
      </View>
      <Section title="Productos">
        {pedido.lineas.map((l) => (
          <View key={l.productoId} style={styles.linea}>
            <View style={styles.flex}>
              <AppText variant="body">{nombreLinea(l)}</AppText>
              <AppText variant="caption" color="onSurfaceVariant">
                {l.cantidad} × {formatPrice(l.precioUnitario ?? 0)}
              </AppText>
            </View>
            <AppText variant="body">{formatPrice((l.precioUnitario ?? 0) * l.cantidad)}</AppText>
          </View>
        ))}
        <View style={[styles.linea, styles.total]}>
          <AppText variant="titleSm">Total</AppText>
          <AppText variant="titleSm" color="primary">
            {formatPrice(pedido.total)}
          </AppText>
        </View>
      </Section>
      <View style={styles.pago}>
        <AppText variant="label">{pedido.pago.metodo === 'EFECTIVO' ? 'Efectivo' : 'QR simulado'}</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {etiquetaPago(pedido)}
        </AppText>
      </View>
      <Button label="Ver pedido" variant="outline" onPress={() => router.push({ pathname: '/orden/[pedidoId]', params: { pedidoId: pedido.id } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  flex: { flex: 1 },
  linea: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  total: { borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.sm },
  pago: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.control, padding: Spacing.md, gap: 2 },
});
