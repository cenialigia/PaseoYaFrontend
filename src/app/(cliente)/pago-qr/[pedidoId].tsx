import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getComercio } from '@/data';
import { useNow } from '@/hooks/use-now';
import { formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

const VIGENCIA_MS = 5 * 60 * 1000;

// CLI-12 · QR de pago SIMULADO (DEC-F14-03): sin dinero real; vence a los 5 min y se puede generar otro.
export default function PagoQr() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { pedidos, simularPago } = useOrders();
  const ahora = useNow(1000);
  const [qr, setQr] = useState(() => ({ nonce: Date.now(), vence: Date.now() + VIGENCIA_MS }));
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState(false);
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const comercio = pedido && getComercio(pedido.comercioId);

  if (!pedido || !comercio) return <ErrorState title="Pedido no encontrado" actionLabel="Ir a mis pedidos" onAction={() => router.navigate('/pedidos')} />;

  if (pedido.pago.estado === 'PAID') {
    return (
      <ErrorState
        title="Este pedido ya está pagado"
        message="No necesitas volver a pagarlo."
        actionLabel="Ver pedido"
        onAction={() => router.replace({ pathname: '/pedido/[pedidoId]/detalle', params: { pedidoId: pedido.id } })}
      />
    );
  }

  const restante = Math.max(qr.vence - ahora, 0);
  const vencido = restante === 0;
  const mm = String(Math.floor(restante / 60000)).padStart(2, '0');
  const ss = String(Math.floor((restante % 60000) / 1000)).padStart(2, '0');

  const pagar = async () => {
    setPagando(true);
    setError(false);
    const ok = await simularPago(pedido.id);
    setPagando(false);
    if (!ok) return setError(true);
    router.replace({ pathname: '/pago-confirmado/[pedidoId]', params: { pedidoId: pedido.id } });
  };

  return (
    <Screen>
      <AppText variant="titleSm">{comercio.nombre}</AppText>
      <AppText variant="bodySm" color="onSurfaceVariant">
        {comercio.piso} · {comercio.local} · {pedido.codigo}
      </AppText>
      <View style={styles.qr} accessible accessibilityLabel={vencido ? 'QR de pago simulado vencido' : `QR de pago simulado, vence en ${mm} minutos ${ss} segundos`}>
        <AppText variant="overline" color="error">
          SIMULADO · SIN VALOR
        </AppText>
        <View style={vencido && styles.apagado}>
          <QRCode value={`paseoya:pago-simulado:${pedido.id}:${qr.nonce}`} size={200} color={Colors.onSurface} backgroundColor={Colors.surfaceContainerLowest} />
        </View>
        <AppText variant="body" color="onSurfaceVariant">
          Monto a pagar
        </AppText>
        <AppText variant="display" color="primary">
          {formatPrice(pedido.total)}
        </AppText>
        <View style={styles.reloj}>
          <MaterialIcons name="schedule" size={18} color={vencido ? Colors.error : Colors.onTertiaryFixedVariant} />
          <AppText variant="label" color={vencido ? 'error' : 'onTertiaryFixedVariant'}>
            {vencido ? 'Este QR venció' : `Este QR expira en ${mm}:${ss}`}
          </AppText>
        </View>
      </View>
      <AppText variant="bodySm" color="onSurfaceVariant">
        Es una demostración: no se realiza ningún cobro. Pulsa «Simular pago» para continuar.
      </AppText>
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudo registrar el pago. Intenta de nuevo.
        </AppText>
      ) : null}
      {vencido ? (
        <Button label="Generar un nuevo QR" onPress={() => setQr({ nonce: Date.now(), vence: Date.now() + VIGENCIA_MS })} />
      ) : (
        <Button label="Simular pago" loading={pagando} onPress={pagar} />
      )}
      <Button label="Pagar más tarde" variant="ghost" onPress={() => router.replace({ pathname: '/pedido/[pedidoId]/detalle', params: { pedidoId: pedido.id } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  qr: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.outline, backgroundColor: Colors.surfaceContainerLowest },
  apagado: { opacity: 0.2 },
  reloj: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
});
