import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { nombreLinea } from '@/components/pedido-comercio-card';
import { HistorialPedido, LineaEstado } from '@/components/linea-estado';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ESTADOS_EN_CURSO, estadoPedidoUI, etiquetaPago, useCatalogo } from '@/data';
import { useEventosPedido } from '@/data/eventos';
import { formatFechaHora, formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

// ADM-07 · Detalle de pedido en modo supervisión: el admin no cambia estados (DEC-F14-06), eso lo hace la tienda.
export default function PedidoAdmin() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { pedidos, reportes } = useOrders();
  const { comercios } = useCatalogo();
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const eventos = useEventosPedido(pedidoId, `${pedido?.estado}-${pedido?.pago.estado}`);
  if (!pedido) return <ErrorState title="Pedido no encontrado" actionLabel="Volver" onAction={() => router.back()} />;
  const comercio = comercios.find((c) => c.id === pedido.comercioId);
  const estado = estadoPedidoUI[pedido.estado];
  const reportesDelPedido = reportes.filter((r) => r.pedidoId === pedido.id);

  return (
    <Screen>
      <View style={styles.fila}>
        <View style={styles.flex}>
          <AppText variant="headline">{pedido.codigo}</AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {pedido.pago.metodo === 'EFECTIVO' ? 'Reserva' : 'Compra'} · {formatFechaHora(pedido.confirmadoEn)}
          </AppText>
        </View>
        <StatusChip label={estado.etiqueta} tone={estado.tono} />
      </View>
      <Card>
        <AppText variant="labelSm" color="onSurfaceVariant">
          Cliente
        </AppText>
        <AppText variant="body">{pedido.clienteNombre ?? '—'}</AppText>
        <AppText variant="labelSm" color="onSurfaceVariant">
          Comercio
        </AppText>
        <AppText variant="body">
          {comercio?.nombre ?? '—'} · {comercio?.piso} · {comercio?.local}
        </AppText>
      </Card>
      <Section title="Productos">
        {pedido.lineas.map((l) => (
          <View key={l.productoId} style={styles.fila}>
            <AppText variant="body" style={styles.flex}>
              {l.cantidad} × {nombreLinea(l)}
            </AppText>
            <AppText variant="body">{formatPrice((l.precioUnitario ?? 0) * l.cantidad)}</AppText>
          </View>
        ))}
        <View style={[styles.fila, styles.total]}>
          <AppText variant="titleSm" style={styles.flex}>
            Total
          </AppText>
          <AppText variant="titleSm" color="primary">
            {formatPrice(pedido.total)}
          </AppText>
        </View>
      </Section>
      <LineaEstado estado={pedido.estado} eventos={eventos} />
      <HistorialPedido eventos={eventos} />

      <View style={styles.pago}>
        <AppText variant="label">Pago</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {etiquetaPago(pedido)}
        </AppText>
        <AppText variant="caption" color="onSurfaceVariant">
          {ESTADOS_EN_CURSO.includes(pedido.estado) ? `Plazo de retiro: ${formatFechaHora(pedido.venceEn)}` : `Plazo de retiro era el ${formatFechaHora(pedido.venceEn)}`}
        </AppText>
      </View>
      {reportesDelPedido.length ? (
        <Section title="Reportes del cliente">
          {reportesDelPedido.map((r) => (
            <Card key={r.id}>
              <AppText variant="bodySm">{r.mensaje}</AppText>
              <AppText variant="caption" color="onSurfaceVariant">
                {formatFechaHora(r.creadoEn)}
              </AppText>
            </Card>
          ))}
        </Section>
      ) : null}
      <AppText variant="caption" color="onSurfaceVariant">
        Supervisión: los cambios de estado los hace la tienda.
      </AppText>
      {comercio ? <Button label="Ver comercio" variant="outline" onPress={() => router.push({ pathname: '/comercio-admin/[comercioId]', params: { comercioId: comercio.id } })} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  total: { borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.sm },
  pago: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.control, padding: Spacing.md, gap: 2 },
});
