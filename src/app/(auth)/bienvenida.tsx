import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors, FontFamily, Spacing } from '@/constants/theme';

// CLI-02 · Bienvenida. Fondo de color en lugar de la foto del mosaico (sin licencia, DEC-F14-12).
export default function Bienvenida() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fondo, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg }]}>
      <View style={styles.marca}>
        <MaterialIcons name="shopping-bag" size={56} color={Colors.onPrimary} />
        <AppText variant="display" color="onPrimary" style={styles.logo}>
          PaseoYa
        </AppText>
      </View>
      <View style={styles.texto}>
        <AppText variant="display" color="onPrimary" accessibilityRole="header">
          Descubre{'\n'}Compra{'\n'}Recoge
        </AppText>
        <AppText variant="body" color="onPrimary">
          Tus tiendas favoritas en Paseo Aranjuez.
        </AppText>
      </View>
      <View style={styles.botones}>
        <Button label="Crear cuenta" variant="secondary" onPress={() => router.push('/registro')} />
        <Button label="Ingresar" variant="outline" style={styles.ingresar} onPress={() => router.push('/ingresar')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: Colors.primaryContainer, paddingHorizontal: Spacing.screen, justifyContent: 'space-between' },
  marca: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logo: { fontFamily: FontFamily.extraBold },
  texto: { gap: Spacing.md },
  botones: { gap: Spacing.md },
  ingresar: { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.surfaceContainerLowest },
});
