import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useFavoritos } from '@/state/favoritos';

type Icono = keyof typeof MaterialIcons.glyphMap;

// Foto real si existe en Storage; si no, placeholder sin marca (DEC-15/F14-16).
export function Visual({ url, icono = 'image', alto = 120, estilo }: { url?: string; icono?: Icono; alto?: number; estilo?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.visual, { height: alto }, estilo]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {url ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <MaterialIcons name={icono} size={Math.min(alto / 2.5, 56)} color={Colors.outline} />}
    </View>
  );
}

export function Descuento({ porcentaje }: { porcentaje?: number }) {
  if (!porcentaje) return null;
  return (
    <View style={styles.descuento} accessible accessibilityLabel={`${porcentaje} por ciento de descuento`}>
      <AppText variant="labelSm" color="onSecondary">
        -{porcentaje}%
      </AppText>
    </View>
  );
}

export function BotonFavorito({ productoId, nombre }: { productoId: string; nombre: string }) {
  const { esFavorito, alternar } = useFavoritos();
  const activo = esFavorito(productoId);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={activo ? `Quitar ${nombre} de favoritos` : `Agregar ${nombre} a favoritos`}
      onPress={() => void alternar(productoId)}
      style={styles.favorito}>
      <MaterialIcons name={activo ? 'favorite' : 'favorite-border'} size={24} color={activo ? Colors.error : Colors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  visual: { borderRadius: Radius.control, backgroundColor: Colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  descuento: { alignSelf: 'flex-start', backgroundColor: Colors.secondary, borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  favorito: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
});
