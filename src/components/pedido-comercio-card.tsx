import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Spacing } from '@/constants/theme';
import { estadoPedidoUI, etiquetaPago, getProducto, useCatalogo, type Pedido } from '@/data';
import { formatFechaHora } from '@/lib/format';

export const nombreLinea = (l: Pedido['lineas'][number]) => l.nombre ?? getProducto(l.productoId)?.nombre ?? 'Producto';

// Tarjeta de pedido del comercio (COM-03) y del admin (ADM-06): toca para abrir el detalle.
export function PedidoComercioCard({ pedido, destino = 'orden' }: { pedido: Pedido; destino?: 'orden' | 'venta' | 'admin' }) {
  const { comercios } = useCatalogo();
  const estado = estadoPedidoUI[pedido.estado];
  const resumen = pedido.lineas.map((l) => `${l.cantidad} × ${nombreLinea(l)}`).join(', ');
  const abrir = () =>
    destino === 'venta'
      ? router.push({ pathname: '/venta/[pedidoId]', params: { pedidoId: pedido.id } })
      : destino === 'admin'
        ? router.push({ pathname: '/pedido-admin/[pedidoId]', params: { pedidoId: pedido.id } })
        : router.push({ pathname: '/orden/[pedidoId]', params: { pedidoId: pedido.id } });
  return (
    <Card onPress={abrir} accessibilityLabel={`Pedido ${pedido.codigo}, ${estado.etiqueta}, ${resumen}`}>
      <View style={styles.fila}>
        <AppText variant="titleSm">{pedido.codigo}</AppText>
        <StatusChip label={estado.etiqueta} tone={estado.tono} />
      </View>
      {destino === 'admin' ? (
        <AppText variant="label">
          {comercios.find((c) => c.id === pedido.comercioId)?.nombre ?? 'Comercio'} · {pedido.clienteNombre ?? 'Cliente'}
        </AppText>
      ) : null}
      <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={2}>
        {resumen}
      </AppText>
      <View style={styles.fila}>
        <PriceText amount={pedido.total} />
        <AppText variant="caption" color="onSurfaceVariant">
          {formatFechaHora(pedido.confirmadoEn)}
        </AppText>
      </View>
      <AppText variant="labelSm" color="onSurfaceVariant">
        {pedido.pago.metodo === 'EFECTIVO' ? 'Reserva · ' : 'Compra · '}
        {etiquetaPago(pedido)}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
});
