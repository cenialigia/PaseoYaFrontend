import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { stockLabel } from '@/components/product-card';
import { BotonFavorito, Descuento, Visual } from '@/components/producto-visual';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PriceText } from '@/components/ui/price-text';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { Screen } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { getComercio, getProducto } from '@/data';
import { useNow } from '@/hooks/use-now';
import { motivoNoAgregado, useCart } from '@/state/cart';

// CLI-09 · Detalle de producto. Sin valoraciones (DEC-F14-05: reseñas no activadas).
export default function ProductoScreen() {
  const { productoId } = useLocalSearchParams<{ productoId: string }>();
  const producto = getProducto(productoId);
  const comercio = producto && getComercio(producto.comercioId);
  const { agregar, cantidadEnCarrito } = useCart();
  const ahora = useNow();
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(null);

  if (!producto || !comercio) return <ErrorState title="Producto no encontrado" actionLabel="Volver" onAction={() => router.back()} />;

  const enCarrito = cantidadEnCarrito(producto.id, ahora);
  const restante = Math.max(producto.stock - enCarrito, 0);
  const puedeAgregar = comercio.abierto && restante > 0;

  const onAgregar = () => {
    const r = agregar(producto.id, Math.min(cantidad, restante));
    setMensaje(r.ok ? { texto: `Agregado a tu carrito de ${comercio.nombre}.`, ok: true } : { texto: motivoNoAgregado[r.reason], ok: false });
    if (r.ok) setCantidad(1);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: producto.nombre, headerRight: () => <BotonFavorito productoId={producto.id} nombre={producto.nombre} /> }} />
      <Visual url={producto.imagenUrl} alto={260} />
      <AppText variant="headline">{producto.nombre}</AppText>
      <Button
        label={`${comercio.nombre} · ${comercio.piso} · ${comercio.local}`}
        variant="ghost"
        accessibilityLabel={`Ver tienda ${comercio.nombre}`}
        onPress={() => router.push({ pathname: '/comercio/[comercioId]', params: { comercioId: comercio.id } })}
      />
      <View style={styles.precio}>
        <PriceText amount={producto.precio} previous={producto.precioAnterior} variant="title" />
        <Descuento porcentaje={producto.descuento} />
      </View>
      <AppText variant="label" color={producto.stock === 0 ? 'error' : 'secondary'}>
        {stockLabel(producto.stock)}
        {enCarrito > 0 ? ` · ${enCarrito} en tu carrito` : ''}
      </AppText>
      {producto.descripcion ? (
        <AppText variant="body" color="onSurfaceVariant">
          {producto.descripcion}
        </AppText>
      ) : null}
      {puedeAgregar ? <QuantityStepper label="Cantidad" value={Math.min(cantidad, restante)} max={restante} onChange={setCantidad} /> : null}
      <Button
        label={!comercio.abierto ? 'Tienda cerrada' : restante === 0 ? (producto.stock === 0 ? 'Agotado' : 'No quedan más unidades') : 'Agregar al carrito'}
        disabled={!puedeAgregar}
        onPress={onAgregar}
      />
      {mensaje ? (
        <View accessibilityLiveRegion="polite" style={styles.feedback}>
          <AppText variant="bodySm" color={mensaje.ok ? 'onSecondaryFixedVariant' : 'error'}>
            {mensaje.texto}
          </AppText>
          {mensaje.ok ? <Button label="Ver carrito" variant="outline" onPress={() => router.push('/carritos')} /> : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  precio: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  feedback: { gap: Spacing.sm },
});
