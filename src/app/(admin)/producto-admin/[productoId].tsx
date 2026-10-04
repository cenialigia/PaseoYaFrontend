import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { cambiarActivo, obtenerProductoComercio, type ProductoComercio } from '@/data/catalogo-comercio';

// ADM-09 · Producto visto por el admin: precio, stock y descripción sólo lectura; únicamente activar o desactivar.
export default function ProductoAdmin() {
  const { productoId } = useLocalSearchParams<{ productoId: string }>();
  const { recargar } = useCatalogo();
  const [producto, setProducto] = useState<ProductoComercio | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    obtenerProductoComercio(productoId).then((p) => {
      if (activo) setProducto(p);
    });
    return () => {
      activo = false;
    };
  }, [productoId]);

  if (producto === undefined) return <LoadingState label="Cargando producto" />;
  if (producto === null) return <ErrorState title="Producto no encontrado" actionLabel="Volver" onAction={() => router.back()} />;
  const p = producto;

  const alternar = () =>
    Alert.alert(p.activo ? `¿Desactivar ${p.nombre}?` : `¿Activar ${p.nombre}?`, p.activo ? 'Los clientes dejarán de verlo.' : 'Los clientes volverán a verlo.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: p.activo ? 'Desactivar' : 'Activar',
        onPress: async () => {
          const ok = await cambiarActivo(p.id, !p.activo);
          setError(!ok);
          if (ok) {
            setProducto({ ...p, activo: !p.activo });
            void recargar();
          }
        },
      },
    ]);

  return (
    <Screen>
      <View style={styles.imagen}>
        {p.imagenUrl ? <Image source={{ uri: p.imagenUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <MaterialIcons name="inventory-2" size={56} color={Colors.outline} />}
      </View>
      <View style={styles.fila}>
        <AppText variant="headline" style={styles.flex}>
          {p.nombre}
        </AppText>
        <StatusChip label={p.activo ? 'Activo' : 'Inactivo'} tone={p.activo ? 'listo' : 'entregado'} />
      </View>
      <PriceText amount={p.precio} previous={p.precioAnterior} variant="title" />
      <AppText variant="label" color={p.stock === 0 ? 'error' : 'onSurfaceVariant'}>
        {p.stock === 0 ? 'Sin stock' : `${p.stock} en stock`}
      </AppText>
      {p.descripcion ? <AppText variant="body">{p.descripcion}</AppText> : null}
      <AppText variant="caption" color="onSurfaceVariant">
        Precio, stock y datos del producto los gestiona el comercio.
      </AppText>
      <Button label={p.activo ? 'Desactivar producto' : 'Activar producto'} variant="outline" onPress={alternar} />
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudo cambiar el producto. Intenta de nuevo.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  imagen: { aspectRatio: 4 / 3, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
});
