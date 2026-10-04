import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { estadoPedidoUI, getComercio, getProducto } from '@/data';
import { formatFechaHora } from '@/lib/format';
import { useOrders } from '@/state/orders';

// CLI-14 / CLI-15 · Ticket de recojo. DEC-16 / DEC-F14-04: el QR + PIN sólo existe en «Listo para recoger».
export default function TicketScreen() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { pedidos } = useOrders();
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const comercio = pedido && getComercio(pedido.comercioId);
  const ticketRef = useRef<View>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!pedido || !comercio) return <ErrorState title="Pedido no encontrado" actionLabel="Volver" onAction={() => router.back()} />;

  if (pedido.estado === 'DELIVERED' || pedido.estado === 'CANCELLED' || pedido.estado === 'EXPIRED') {
    const mensaje = pedido.estado === 'DELIVERED' ? 'Este código ya se usó: el pedido fue entregado.' : 'El pedido ya no está activo; no hay código de recojo.';
    return <EmptyState title="Código no disponible" message={mensaje} actionLabel="Volver" onAction={() => router.back()} />;
  }

  const reserva = pedido.pago.metodo === 'EFECTIVO';
  const listo = pedido.estado === 'READY_FOR_PICKUP' && !!pedido.pin;

  const guardar = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const uri = await captureRef(ticketRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Ticket ${pedido.codigo}` });
      else setAviso('No se puede compartir en este dispositivo.');
    } catch {
      setAviso('No se pudo guardar el ticket. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Screen>
      <View ref={ticketRef} collapsable={false} style={styles.ticket}>
        <View style={styles.cabecera}>
          <AppText variant="titleSm" color="primary">
            PaseoYa
          </AppText>
          <View style={[styles.sello, reserva ? styles.selloReserva : styles.selloPagado]}>
            <AppText variant="labelSm" color={reserva ? 'onTertiaryFixedVariant' : 'onSecondaryFixedVariant'}>
              {reserva ? 'RESERVA' : pedido.pago.estado === 'PAID' ? 'PAGADO' : 'PAGO PENDIENTE'}
            </AppText>
          </View>
        </View>
        <AppText variant="titleSm">{comercio.nombre}</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {comercio.piso} · {comercio.local} · {pedido.codigo}
        </AppText>

        {listo ? (
          <View style={styles.codigo} accessible accessibilityLabel={`Código de recojo del pedido ${pedido.codigo}`}>
            <AppText variant="label">Código de recojo</AppText>
            {/* Contenido de demostración: en el backend la credencial la emite una función confiable. */}
            <QRCode value={`paseoya:retiro:${pedido.id}:${pedido.pin}`} size={190} color={Colors.onSurface} backgroundColor={Colors.surfaceContainerLowest} />
            <AppText variant="caption" color="onSurfaceVariant">
              PIN de respaldo
            </AppText>
            <AppText variant="display" color="primary" accessibilityLabel={`PIN de respaldo: ${pedido.pin!.split('').join(' ')}`}>
              {pedido.pin}
            </AppText>
          </View>
        ) : (
          <View style={styles.espera} accessibilityLiveRegion="polite">
            <MaterialIcons name="hourglass-empty" size={40} color={Colors.onTertiaryFixedVariant} />
            <AppText variant="label" style={styles.centro}>
              Estado: {estadoPedidoUI[pedido.estado].etiqueta}
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant" style={styles.centro}>
              Tu código de recojo aparecerá aquí cuando la tienda marque el pedido como listo. Te avisaremos con una notificación.
            </AppText>
          </View>
        )}

        <View style={styles.items}>
          <AppText variant="label">{reserva ? 'Productos reservados' : 'Productos del pedido'}</AppText>
          {pedido.lineas.map((l) => (
            <View key={l.productoId} style={styles.fila}>
              <AppText variant="bodySm" color="onSurfaceVariant" style={styles.flex}>
                {getProducto(l.productoId)?.nombre ?? 'Producto'}
              </AppText>
              <AppText variant="bodySm">x{l.cantidad}</AppText>
            </View>
          ))}
          <View style={styles.fila}>
            <AppText variant="label">{reserva ? 'Total a pagar en tienda' : 'Total'}</AppText>
            <PriceText amount={pedido.total} variant="label" />
          </View>
          <AppText variant="caption" color="onSurfaceVariant">
            {reserva ? 'Fecha de reserva' : 'Fecha de compra'}: {formatFechaHora(pedido.confirmadoEn)}
          </AppText>
          <AppText variant="caption" color="onSurfaceVariant">
            Recoger antes del: {formatFechaHora(pedido.venceEn)}
          </AppText>
        </View>
      </View>

      {listo ? (
        <View style={styles.aviso}>
          <AppText variant="bodySm" color="onPrimaryFixedVariant">
            {reserva ? 'Muestra este código en la tienda para recoger tu reserva y pagar en efectivo.' : 'Muestra este código en la tienda para recoger tu pedido.'} No lo compartas: quien lo presente puede recogerlo.
          </AppText>
        </View>
      ) : null}
      {listo ? <Button label="Guardar ticket" variant="outline" loading={guardando} onPress={guardar} /> : null}
      {aviso ? (
        <AppText variant="bodySm" color="error" accessibilityLiveRegion="polite">
          {aviso}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ticket: { gap: Spacing.sm, padding: Spacing.lg, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.outline, backgroundColor: Colors.surfaceContainerLowest },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sello: { borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  selloPagado: { backgroundColor: Colors.secondaryFixed },
  selloReserva: { backgroundColor: Colors.tertiaryFixed },
  codigo: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  espera: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg, borderRadius: Radius.control, backgroundColor: Colors.tertiaryFixed },
  centro: { textAlign: 'center' },
  items: { gap: Spacing.xs, marginTop: Spacing.sm },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  aviso: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md },
});
