import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { LineaEstado } from '@/components/linea-estado';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen, Section } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ESTADOS_EN_CURSO, estadoPedidoUI, etiquetaPago, getComercio, getProducto } from '@/data';
import { formatFechaHora, formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

// CLI-19 / CLI-21 · Detalle de reserva o compra: estado, productos y recojo primero; pago en un bloque aparte.
export default function PedidoScreen() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { pedidos, cancelar } = useOrders();
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const comercio = pedido && getComercio(pedido.comercioId);

  if (!pedido || !comercio) return <ErrorState title="Pedido no encontrado" actionLabel="Ir a mis pedidos" onAction={() => router.navigate('/pedidos')} />;

  const estado = estadoPedidoUI[pedido.estado];
  const reserva = pedido.pago.metodo === 'EFECTIVO';
  const activo = pedido.estado !== 'CANCELLED' && pedido.estado !== 'EXPIRED' && pedido.estado !== 'DELIVERED';
  const qrPendiente = !reserva && pedido.pago.estado === 'PENDING' && activo;

  const confirmarCancelacion = () =>
    Alert.alert(
      'Cancelar pedido',
      pedido.pago.estado === 'PAID' ? 'Se cancelará el pedido y el pago simulado pasará a reembolso simulado.' : 'Se cancelará el pedido.',
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Cancelar pedido', style: 'destructive', onPress: () => void cancelar(pedido.id) },
      ],
    );

  return (
    <Screen>
      <Stack.Screen options={{ title: `${reserva ? 'Reserva' : 'Compra'} ${pedido.codigo}` }} />
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="titleSm">{comercio.nombre}</AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {comercio.piso} · {comercio.local}
          </AppText>
        </View>
        <StatusChip label={estado.etiqueta} tone={estado.tono} />
      </View>

      <Section title={reserva ? 'Productos reservados' : 'Productos comprados'}>
        {pedido.lineas.map((l) => (
          <View key={l.productoId} style={styles.row}>
            <AppText variant="body" style={styles.flex}>
              {getProducto(l.productoId)?.nombre ?? 'Producto'}
            </AppText>
            <AppText variant="label">x{l.cantidad}</AppText>
          </View>
        ))}
        <View style={styles.row}>
          <AppText variant="label">Total</AppText>
          <PriceText amount={pedido.total} />
        </View>
        <AppText variant="caption" color="onSurfaceVariant">
          {reserva ? 'Fecha de reserva' : 'Fecha de compra'}: {formatFechaHora(pedido.confirmadoEn)}
          {ESTADOS_EN_CURSO.includes(pedido.estado) ? ` · Recoger antes del ${formatFechaHora(pedido.venceEn)}` : ''}
        </AppText>
      </Section>

      <LineaEstado estado={pedido.estado} />

      <View style={styles.pago}>
        <AppText variant="overline" color="onPrimaryFixedVariant">
          PAGO
        </AppText>
        <AppText variant="label" color="onPrimaryFixedVariant">
          {etiquetaPago(pedido)}
        </AppText>
        <AppText variant="bodySm" color="onPrimaryFixedVariant">
          {reserva ? `Pagas ${formatPrice(pedido.total)} en efectivo en la tienda al recoger.` : 'Pago simulado con QR: no se realiza ningún cobro real.'}
        </AppText>
        {qrPendiente ? <Button label="Pagar con QR" onPress={() => router.push({ pathname: '/pago-qr/[pedidoId]', params: { pedidoId: pedido.id } })} /> : null}
      </View>

      {activo ? <Button label="Ver ticket de recojo" onPress={() => router.push({ pathname: '/pedido/[pedidoId]/ticket', params: { pedidoId: pedido.id } })} /> : null}
      {/* DEC-08: el cliente sólo cancela antes de que empiece la preparación. */}
      {pedido.estado === 'CONFIRMED' ? <Button label="Cancelar pedido" variant="outline" onPress={confirmarCancelacion} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1, flexShrink: 1 },
  pago: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.sm },
});
