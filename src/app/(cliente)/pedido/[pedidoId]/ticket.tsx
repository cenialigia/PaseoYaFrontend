import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { credencialIlustrativa, getComercio, pedidos } from '@/fixtures';

export default function TicketScreen() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const comercio = pedido && getComercio(pedido.comercioId);

  if (!pedido || !comercio) return <ErrorState title="Pedido no encontrado" actionLabel="Volver" onAction={() => router.back()} />;

  // La credencial sólo se muestra cuando el pedido está listo para retiro.
  if (pedido.estado !== 'READY_FOR_PICKUP') {
    return <EmptyState title="Código no disponible" message="El código de retiro aparece cuando el pedido está listo." />;
  }

  return (
    <Screen>
      <AppText variant="titleSm">
        {comercio.nombre} · {pedido.codigo}
      </AppText>
      <AppText variant="bodySm" color="onSurfaceVariant">
        Presente este código en {comercio.local} · {comercio.piso}.
      </AppText>
      <View style={styles.credential} accessible accessibilityLabel="Código de retiro ilustrativo, no válido">
        <AppText variant="overline" color="onErrorContainer">
          ILUSTRATIVO · NO VÁLIDO
        </AppText>
        <AppText variant="caption" color="onSurfaceVariant">
          {credencialIlustrativa.qr}
        </AppText>
        <AppText variant="display" color="primary">
          {credencialIlustrativa.pin}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  credential: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
  },
});
