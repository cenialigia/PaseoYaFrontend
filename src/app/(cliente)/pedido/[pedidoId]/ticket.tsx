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
import { getComercio, getProducto, totalLineas } from '@/fixtures';
import { useOrders } from '@/state/orders';

export default function TicketScreen() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { pedidos } = useOrders();
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const comercio = pedido && getComercio(pedido.comercioId);
  const ticketRef = useRef<View>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!pedido || !comercio) return <ErrorState title="Pedido no encontrado" actionLabel="Volver" onAction={() => router.back()} />;

  // DEC-16: la credencial sólo existe mientras el pedido está listo para retiro.
  if (pedido.estado !== 'READY_FOR_PICKUP' || !pedido.pin) {
    const mensaje =
      pedido.estado === 'DELIVERED'
        ? 'Este código ya se usó: el pedido fue entregado.'
        : pedido.estado === 'CANCELLED' || pedido.estado === 'EXPIRED'
          ? 'El pedido ya no está activo; no hay código de retiro.'
          : 'El código de retiro aparece cuando el pedido está listo.';
    return <EmptyState title="Código no disponible" message={mensaje} actionLabel="Volver" onAction={() => router.back()} />;
  }

  const guardar = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const uri = await captureRef(ticketRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Ticket ${pedido.codigo}` });
      else setAviso('No se puede compartir en este dispositivo.');
    } catch {
      setAviso('No se pudo guardar el ticket. Intente de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Screen>
      <View ref={ticketRef} collapsable={false} style={styles.ticket}>
        <AppText variant="overline" color="onSecondaryFixedVariant">
          CÓDIGO DE RETIRO · UN SOLO USO
        </AppText>
        <AppText variant="titleSm">
          {comercio.nombre} · {pedido.codigo}
        </AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          Presente este código en {comercio.local} · {comercio.piso}.
        </AppText>
        <View style={styles.qr} accessible accessibilityLabel={`Código QR de retiro del pedido ${pedido.codigo}`}>
          {/* Contenido de demostración: en el backend la credencial la firma una función confiable (BE-04). */}
          <QRCode value={`paseoya:retiro:${pedido.id}:${pedido.pin}`} size={200} color={Colors.onSurface} backgroundColor={Colors.surfaceContainerLowest} />
        </View>
        <AppText variant="caption" color="onSurfaceVariant">
          PIN de respaldo
        </AppText>
        <AppText variant="display" color="primary" accessibilityLabel={`PIN de respaldo: ${pedido.pin.split('').join(' ')}`}>
          {pedido.pin}
        </AppText>
        <View style={styles.items}>
          {pedido.lineas.map((l) => (
            <AppText key={l.productoId} variant="bodySm" color="onSurfaceVariant">
              {l.cantidad} × {getProducto(l.productoId)?.nombre}
            </AppText>
          ))}
          <PriceText amount={totalLineas(pedido.lineas)} />
        </View>
      </View>

      <View style={styles.aviso}>
        <AppText variant="bodySm" color="onErrorContainer">
          No comparta este código con otras personas: quien lo presente puede retirar el pedido.
        </AppText>
      </View>
      <Button label="Guardar ticket" variant="outline" loading={guardando} onPress={guardar} />
      {aviso ? (
        <AppText variant="bodySm" color="error" accessibilityLiveRegion="polite">
          {aviso}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ticket: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  qr: { padding: Spacing.sm, backgroundColor: Colors.surfaceContainerLowest },
  items: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm },
  aviso: { backgroundColor: Colors.errorContainer, borderRadius: Radius.control, padding: Spacing.md },
});
