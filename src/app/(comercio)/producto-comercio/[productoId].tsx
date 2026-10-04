import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen, Section } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data/catalogo';
import {
  cambiarActivo,
  eliminarProducto,
  etiquetaPromocion,
  listarPromocionesComercio,
  obtenerProductoComercio,
  type ProductoComercio,
  type PromocionComercio,
} from '@/data/catalogo-comercio';
import { formatFechaHora } from '@/lib/format';
import { useAuth } from '@/state/auth';
import { useOrders } from '@/state/orders';
import { ESTADOS_EN_CURSO } from '@/data';

// COM-08 · Detalle de producto: imagen, precio, stock, descripción, promociones y acciones.
// «Eliminar» sólo funciona sin pedidos (DEC-F14-07); con pedidos se ofrece desactivar.
export default function ProductoComercioDetalle() {
  const { productoId } = useLocalSearchParams<{ productoId: string }>();
  const { usuario } = useAuth();
  const { recargar } = useCatalogo();
  const { pedidos } = useOrders();
  // §11: el stock mostrado es el disponible; lo apartado en pedidos en curso se informa aparte.
  const reservadas = pedidos
    .filter((x) => ESTADOS_EN_CURSO.includes(x.estado))
    .flatMap((x) => x.lineas)
    .filter((l) => l.productoId === productoId)
    .reduce((s, l) => s + l.cantidad, 0);
  const [producto, setProducto] = useState<ProductoComercio | null | undefined>(undefined);
  const [promos, setPromos] = useState<PromocionComercio[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      Promise.all([obtenerProductoComercio(productoId), listarPromocionesComercio(usuario?.comercioId ?? '')]).then(([p, ps]) => {
        if (!activo) return;
        setProducto(p);
        setPromos((ps ?? []).filter((x) => x.productoId === productoId));
      });
      return () => {
        activo = false;
      };
    }, [productoId, usuario?.comercioId]),
  );

  if (producto === undefined) return <LoadingState label="Cargando producto" />;
  if (producto === null) return <ErrorState title="Producto no encontrado" actionLabel="Volver" onAction={() => router.back()} />;
  const p = producto;

  const alternar = () =>
    Alert.alert(p.activo ? `¿Desactivar ${p.nombre}?` : `¿Activar ${p.nombre}?`, p.activo ? 'Los clientes dejarán de verlo.' : 'Los clientes volverán a verlo.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: p.activo ? 'Desactivar' : 'Activar',
        onPress: async () => {
          setOcupado(true);
          const ok = await cambiarActivo(p.id, !p.activo);
          setOcupado(false);
          if (!ok) return setMensaje('No se pudo cambiar el estado. Intenta de nuevo.');
          setProducto({ ...p, activo: !p.activo });
          void recargar();
        },
      },
    ]);

  const eliminar = () =>
    Alert.alert(`¿Eliminar ${p.nombre}?`, 'Se borrará de forma definitiva. Si ya tiene pedidos, sólo podrás desactivarlo.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setOcupado(true);
          const r = await eliminarProducto(p.id, p.imagenPath);
          setOcupado(false);
          if (r === 'ok') {
            void recargar();
            return router.back();
          }
          setMensaje(
            r === 'con-pedidos'
              ? 'Este producto tiene pedidos y no se puede eliminar para conservar el historial. Desactívalo para ocultarlo.'
              : 'No se pudo eliminar. Intenta de nuevo.',
          );
        },
      },
    ]);

  return (
    <Screen>
      <View style={styles.imagen}>
        {p.imagenUrl ? (
          <Image source={{ uri: p.imagenUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Foto de ${p.nombre}`} />
        ) : (
          <MaterialIcons name="inventory-2" size={64} color={Colors.outline} />
        )}
      </View>
      <View style={styles.fila}>
        <AppText variant="headline" style={styles.flex}>
          {p.nombre}
        </AppText>
        <StatusChip label={p.activo ? 'Activo' : 'Inactivo'} tone={p.activo ? 'listo' : 'entregado'} />
      </View>
      <PriceText amount={p.precio} previous={p.precioAnterior} variant="title" />
      <AppText variant="label" color={p.stock === 0 ? 'error' : 'onSurfaceVariant'}>
        {p.stock === 0 ? 'Sin stock disponible' : `${p.stock} disponibles`}
      </AppText>
      {reservadas > 0 ? (
        <AppText variant="bodySm" color="onTertiaryFixedVariant">
          {reservadas} {reservadas === 1 ? 'unidad reservada' : 'unidades reservadas'} en pedidos en curso
        </AppText>
      ) : null}
      {p.descripcion ? <AppText variant="body">{p.descripcion}</AppText> : null}

      <Button label="Editar producto" onPress={() => router.push({ pathname: '/editar-producto/[productoId]', params: { productoId: p.id } })} />
      <Button label={p.activo ? 'Desactivar' : 'Activar'} variant="outline" loading={ocupado} onPress={alternar} />

      <Section title="Promociones">
        {promos.length === 0 ? (
          <AppText variant="bodySm" color="onSurfaceVariant">
            Este producto no tiene promociones.
          </AppText>
        ) : (
          promos.map((x) => (
            <Card key={x.id} accessibilityLabel={`${x.porcentaje} por ciento, ${etiquetaPromocion[x.estado].texto}`}>
              <View style={styles.fila}>
                <AppText variant="titleSm">-{x.porcentaje}%</AppText>
                <StatusChip label={etiquetaPromocion[x.estado].texto} tone={etiquetaPromocion[x.estado].tono} />
              </View>
              <AppText variant="caption" color="onSurfaceVariant">
                Hasta el {formatFechaHora(x.fin)}
              </AppText>
            </Card>
          ))
        )}
        <Button label="Crear promoción" variant="outline" onPress={() => router.push({ pathname: '/nueva-promocion/[productoId]', params: { productoId: p.id } })} />
      </Section>

      <Button label="Eliminar producto" variant="ghost" disabled={ocupado} onPress={eliminar} />
      {mensaje ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {mensaje}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  imagen: { aspectRatio: 4 / 3, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  flex: { flex: 1 },
});
