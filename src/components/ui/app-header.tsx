import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Colors, FontFamily, Spacing, TouchTarget } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useCart } from '@/state/cart';
import { useNotificaciones } from '@/state/notificaciones';

type Accion = { icono: keyof typeof MaterialIcons.glyphMap; etiqueta: string; contador?: number; destino: '/favoritos' | '/notificaciones' | '/carritos' };

function BotonIcono({ icono, etiqueta, contador, destino }: Accion) {
  const texto = contador ? `${etiqueta}, ${contador} ${contador === 1 ? 'nuevo' : 'nuevos'}` : etiqueta;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={texto} onPress={() => router.push(destino)} style={styles.accion} hitSlop={4}>
      <MaterialIcons name={icono} size={26} color={Colors.primary} />
      {contador ? (
        <View style={styles.badge}>
          <AppText variant="overline" color="onError">
            {contador > 9 ? '9+' : contador}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

// Encabezado de las pestañas del cliente (DEC-F14-02): marca, favoritos, avisos y carrito.
export function AppHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  const ahora = useNow();
  const carritos = useCart().carritos.filter((c) => c.expiraEn > ahora).length;
  const { noLeidas } = useNotificaciones();
  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.brandRow}>
        <View style={styles.marca} accessible accessibilityRole="header" accessibilityLabel="PaseoYa, Paseo Aranjuez">
          <MaterialIcons name="shopping-bag" size={26} color={Colors.primary} />
          <AppText variant="titleSm" color="primary" style={styles.logo}>
            PaseoYa
          </AppText>
        </View>
        <View style={styles.actions}>
          <BotonIcono icono="favorite-border" etiqueta="Mis favoritos" destino="/favoritos" />
          <BotonIcono icono="notifications-none" etiqueta="Notificaciones" contador={noLeidas} destino="/notificaciones" />
          <BotonIcono icono="shopping-cart" etiqueta="Mi carrito" contador={carritos} destino="/carritos" />
        </View>
      </View>
      <AppText variant="headline" accessibilityRole="header">
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.surface, paddingHorizontal: Spacing.screen, paddingBottom: Spacing.md, gap: Spacing.sm },
  brandRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  marca: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  logo: { fontFamily: FontFamily.extraBold },
  actions: { flexDirection: 'row' },
  accion: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
