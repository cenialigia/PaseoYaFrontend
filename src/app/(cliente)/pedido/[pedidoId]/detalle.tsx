import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen, Section } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { estadoPedidoUI, etiquetaPago, getComercio, getProducto, totalLineas } from '@/fixtures';
import { formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

export default function PedidoScreen() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { pedidos } = useOrders();
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const comercio = pedido && getComercio(pedido.comercioId);

  if (!pedido || !comercio) return <ErrorState title="Pedido no encontrado" actionLabel="Ver mis pedidos" onAction={() => router.navigate('/pedidos')} />;

  const estado = estadoPedidoUI[pedido.estado];
  const listo = pedido.estado === 'READY_FOR_PICKUP';

  return (
    <Screen>
      <AppText variant="headline" accessibilityRole="header">
        Pedido {pedido.codigo}
      </AppText>
      <StatusChip label={estado.etiqueta} tone={estado.tono} />
      <AppText variant="body" color="onSurfaceVariant">
        {comercio.nombre} · {comercio.local} · {comercio.piso}
      </AppText>

      <Section title="Productos">
        {pedido.lineas.map((l) => {
          const p = getProducto(l.productoId);
          return (
            <View key={l.productoId} style={styles.row}>
              <AppText variant="body" style={styles.flex}>
                {l.cantidad} × {p?.nombre}
              </AppText>
              <AppText variant="label">{formatPrice((p?.precio ?? 0) * l.cantidad)}</AppText>
            </View>
          );
        })}
        <View style={styles.row}>
          <AppText variant="label">Total</AppText>
          <PriceText amount={totalLineas(pedido.lineas)} />
        </View>
      </Section>

      {/* Pago y retiro van en bloques separados para que nunca se confundan (MK-04). */}
      <View style={styles.pago} accessible accessibilityLabel={`Pago: ${etiquetaPago(pedido.pago)}`}>
        <AppText variant="overline" color="onPrimaryFixedVariant">
          PAGO
        </AppText>
        <AppText variant="label" color="onPrimaryFixedVariant">
          {etiquetaPago(pedido.pago)}
        </AppText>
        <AppText variant="bodySm" color="onPrimaryFixedVariant">
          {pedido.pago.metodo === 'QR_SIMULADO'
            ? 'Demostración sin cobro real. La confirmación del pago simulado está pendiente [DEC-04].'
            : 'Pagará en efectivo en el local al retirar. Plazo para retirar: [plazo DEC-06].'}
        </AppText>
      </View>

      <View style={styles.retiro}>
        <AppText variant="overline" color="onSecondaryFixedVariant">
          RETIRO
        </AppText>
        <AppText variant="bodySm" color="onSecondaryFixedVariant">
          {listo
            ? 'Su pedido está listo. Presente el código de retiro en el local.'
            : 'El código de retiro aparecerá cuando el comercio marque el pedido como listo.'}
        </AppText>
        {listo ? (
          <Button label="Ver código de retiro" onPress={() => router.push({ pathname: '/pedido/[pedidoId]/ticket', params: { pedidoId: pedido.id } })} />
        ) : null}
      </View>

      <Button label="Ver mis pedidos" variant="outline" onPress={() => router.navigate('/pedidos')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1, flexShrink: 1 },
  pago: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.xs },
  retiro: { backgroundColor: Colors.secondaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.sm },
});
