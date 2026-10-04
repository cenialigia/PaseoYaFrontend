import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Colors, FontFamily, Spacing, TouchTarget } from '@/constants/theme';
import { useNotificaciones } from '@/state/notificaciones';

type Props = {
  title: string;
  marca: string;
  marcaAccesible: string;
  icono: keyof typeof MaterialIcons.glyphMap;
  rutaAvisos: '/avisos' | '/avisos-admin';
  rutaPerfil: '/mi-comercio' | '/perfil-admin';
  perfilEtiqueta: string;
  imagenUrl?: string;
};

// Encabezado de las pestañas de comercio y admin (DEC-F14-02): avisos y avatar → perfil, fuera de la barra.
export function RolHeader({ title, marca, marcaAccesible, icono, rutaAvisos, rutaPerfil, perfilEtiqueta, imagenUrl }: Props) {
  const insets = useSafeAreaInsets();
  const { noLeidas } = useNotificaciones();
  const avisos = noLeidas ? `Avisos, ${noLeidas} ${noLeidas === 1 ? 'nuevo' : 'nuevos'}` : 'Avisos';
  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.fila}>
        <View style={styles.marca} accessible accessibilityRole="header" accessibilityLabel={marcaAccesible}>
          <MaterialIcons name={icono} size={26} color={Colors.primary} />
          <AppText variant="titleSm" color="primary" style={styles.logo} numberOfLines={1}>
            {marca}
          </AppText>
        </View>
        <View style={styles.acciones}>
          <Pressable accessibilityRole="button" accessibilityLabel={avisos} onPress={() => router.push(rutaAvisos)} style={styles.accion} hitSlop={4}>
            <MaterialIcons name="notifications-none" size={26} color={Colors.primary} />
            {noLeidas ? (
              <View style={styles.badge}>
                <AppText variant="overline" color="onError">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </AppText>
              </View>
            ) : null}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={perfilEtiqueta} onPress={() => router.push(rutaPerfil)} style={styles.accion} hitSlop={4}>
            <View style={styles.avatar}>
              {imagenUrl ? (
                <Image source={{ uri: imagenUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <MaterialIcons name="person" size={20} color={Colors.primary} />
              )}
            </View>
          </Pressable>
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
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  marca: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 1 },
  logo: { fontFamily: FontFamily.extraBold, flexShrink: 1 },
  acciones: { flexDirection: 'row' },
  accion: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
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
