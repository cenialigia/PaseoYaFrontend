import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Descuento, Visual } from '@/components/producto-visual';
import { AppText } from '@/components/ui/app-text';
import { PriceText } from '@/components/ui/price-text';
import { Colors, Elevation, Radius, Spacing } from '@/constants/theme';
import { getComercio, type Producto } from '@/data';

// Tarjeta compacta para carruseles horizontales (Inicio, Promociones para ti, Más pedidos).
export function MiniProducto({ producto }: { producto: Producto }) {
  const comercio = getComercio(producto.comercioId);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${producto.nombre}, ${comercio?.nombre}`}
      onPress={() => router.push({ pathname: '/producto/[productoId]', params: { productoId: producto.id } })}
      style={styles.card}>
      <Visual url={producto.imagenUrl} alto={96} />
      <AppText variant="label" numberOfLines={2}>
        {producto.nombre}
      </AppText>
      <AppText variant="caption" color="onSurfaceVariant" numberOfLines={1}>
        {comercio?.nombre}
      </AppText>
      <View style={styles.precio}>
        <PriceText amount={producto.precio} previous={producto.precioAnterior} variant="label" />
        <Descuento porcentaje={producto.descuento} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerLow,
    padding: Spacing.sm,
    gap: Spacing.xs,
    ...Elevation.card,
  },
  precio: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.xs },
});
