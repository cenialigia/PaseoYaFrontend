import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen, Section } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { estadoPedidoUI, etiquetaPago, getComercio, getProducto } from '@/data';
import { formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

export default function PedidoScreen() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { pedidos, simularPago, cancelar } = useOrders();
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const comercio = pedido && getComercio(pedido.comercioId);

  if (!pedido || !comercio) return <ErrorState title="Pedido no encontrado" actionLabel="Ver mis pedidos" onAction={() => router.navigate('/pedidos')} />;

  const estado = estadoPedidoUI[pedido.estado];
  const listo = pedido.estado === 'READY_FOR_PICKUP';
  const activo = pedido.estado !== 'CANCELLED' && pedido.estado !== 'EXPIRED' && pedido.estado !== 'DELIVERED';
  const qrPendiente = pedido.pago.metodo === 'QR_SIMULADO' && pedido.pago.estado === 'PENDING' && activo;
  const total = pedido.total;

  const confirmarCancelacion = () =>
    Alert.alert(
      'Cancelar pedido',
      pedido.pago.estado === 'PAID' ? 'El pedido se cancelará y el pago simulado pasará a reembolso simulado.' : 'El pedido se cancelará.',
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Cancelar pedido', style: 'destructive', onPress: () => void cancelar(pedido.id) },
      ],
    );

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
          <PriceText amount={total} />
        </View>
      </Section>

      {/* Pago y retiro van en bloques separados para que nunca se confundan (MK-04). */}
      <View style={styles.pago}>
        <AppText variant="overline" color="onPrimaryFixedVariant">
          PAGO
        </AppText>
        <AppText variant="label" color="onPrimaryFixedVariant">
          {etiquetaPago(pedido)}
        </AppText>
        {qrPendiente ? (
          <>
            <View style={styles.qrPago} accessible accessibilityLabel="QR de pago simulado, sin valor">
              <AppText variant="overline" color="error">
                SIMULADO · SIN VALOR
              </AppText>
              <QRCode value={`paseoya:pago-simulado:${pedido.id}:${total}`} size={140} color={Colors.primaryContainer} backgroundColor={Colors.surfaceContainerLowest} />
            </View>
            <AppText variant="bodySm" color="onPrimaryFixedVariant">
              Demostración sin cobro real. Pulse «Simular pago» para marcarlo como pagado.
            </AppText>
            <Button label="Simular pago" onPress={() => void simularPago(pedido.id)} />
          </>
        ) : (
          <AppText variant="bodySm" color="onPrimaryFixedVariant">
            {pedido.pago.metodo === 'EFECTIVO'
              ? 'Pagará en efectivo en el local al retirar. Plazo para retirar: 72 horas desde la confirmación.'
              : 'Demostración sin cobro real. Plazo para retirar: 14 días desde la confirmación.'}
          </AppText>
        )}
      </View>

      <View style={styles.retiro}>
        <AppText variant="overline" color="onSecondaryFixedVariant">
          RETIRO
        </AppText>
        <AppText variant="bodySm" color="onSecondaryFixedVariant">
          {listo
            ? 'Su pedido está listo. Presente el código de retiro en el local.'
            : pedido.estado === 'DELIVERED'
              ? 'Pedido entregado.'
              : activo
                ? 'El código de retiro aparecerá cuando el comercio marque el pedido como listo.'
                : 'Este pedido ya no está activo.'}
        </AppText>
        {listo ? (
          <Button label="Ver código de retiro" onPress={() => router.push({ pathname: '/pedido/[pedidoId]/ticket', params: { pedidoId: pedido.id } })} />
        ) : null}
      </View>

      {/* DEC-08: el cliente sólo cancela antes de que empiece la preparación. */}
      {pedido.estado === 'CONFIRMED' ? <Button label="Cancelar pedido" variant="outline" onPress={confirmarCancelacion} /> : null}
      <Button label="Ver mis pedidos" variant="ghost" onPress={() => router.navigate('/pedidos')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1, flexShrink: 1 },
  pago: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.sm },
  qrPago: { alignItems: 'center', gap: Spacing.xs, padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest },
  retiro: { backgroundColor: Colors.secondaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.sm },
});
