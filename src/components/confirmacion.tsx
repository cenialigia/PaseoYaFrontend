import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors, Spacing } from '@/constants/theme';

type Props = { titulo: string; mensaje: string; pedidoId: string; nota?: string };

// CLI-13 / CLI-17 · Pantalla de éxito: un mensaje, acceso al ticket y a mis pedidos.
export function Confirmacion({ titulo, mensaje, pedidoId, nota }: Props) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.circulo} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <MaterialIcons name="check" size={64} color={Colors.onSecondary} />
      </View>
      <AppText variant="headline" accessibilityRole="header" style={styles.centro}>
        {titulo}
      </AppText>
      <AppText variant="body" color="onSurfaceVariant" style={styles.centro} accessibilityLiveRegion="polite">
        {mensaje}
      </AppText>
      {nota ? (
        <AppText variant="bodySm" color="onSurfaceVariant" style={styles.centro}>
          {nota}
        </AppText>
      ) : null}
      <View style={styles.botones}>
        <Button label="Ver ticket de recojo" onPress={() => router.replace({ pathname: '/pedido/[pedidoId]/ticket', params: { pedidoId } })} />
        <Button label="Ir a mis pedidos" variant="outline" onPress={() => router.navigate('/pedidos')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', padding: Spacing.screen, gap: Spacing.md },
  circulo: { width: 112, height: 112, borderRadius: 56, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  centro: { textAlign: 'center' },
  botones: { alignSelf: 'stretch', gap: Spacing.sm, marginTop: Spacing.lg },
});
