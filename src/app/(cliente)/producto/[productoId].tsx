import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { stockLabel } from '@/components/product-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PriceText } from '@/components/ui/price-text';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { Screen } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getComercio, getProducto } from '@/data';
import { useNow } from '@/hooks/use-now';
import { motivoNoAgregado, useCart } from '@/state/cart';

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
    setMensaje(r.ok ? { texto: `Agregado al carrito de ${comercio.nombre}.`, ok: true } : { texto: motivoNoAgregado[r.reason], ok: false });
    if (r.ok) setCantidad(1);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: producto.nombre }} />
      <View style={styles.placeholder} />
      <AppText variant="headline">{producto.nombre}</AppText>
      <AppText variant="body" color="onSurfaceVariant">
        {comercio.nombre} · {comercio.local} · {comercio.piso}
      </AppText>
      <PriceText amount={producto.precio} previous={producto.precioAnterior} variant="title" />
      <AppText variant="label" color={producto.stock === 0 ? 'error' : 'secondary'}>
        {stockLabel(producto.stock)}
        {enCarrito > 0 ? ` · ${enCarrito} en su carrito` : ''}
      </AppText>
      {puedeAgregar ? (
        <QuantityStepper label="Cantidad" value={Math.min(cantidad, restante)} max={restante} onChange={setCantidad} />
      ) : null}
      <Button
        label={!comercio.abierto ? 'Comercio cerrado' : restante === 0 ? (producto.stock === 0 ? 'Agotado' : 'Sin más unidades disponibles') : `Agregar al carrito de ${comercio.nombre}`}
        disabled={!puedeAgregar}
        onPress={onAgregar}
      />
      {mensaje ? (
        <View accessibilityLiveRegion="polite" style={styles.feedback}>
          <AppText variant="bodySm" color={mensaje.ok ? 'onSecondaryFixedVariant' : 'error'}>
            {mensaje.texto}
          </AppText>
          {mensaje.ok ? <Button label="Ver carritos" variant="outline" onPress={() => router.navigate('/carritos')} /> : null}
        </View>
      ) : null}
      <Button label={`Ver tienda ${comercio.nombre}`} variant="ghost" onPress={() => router.push({ pathname: '/comercio/[comercioId]', params: { comercioId: comercio.id } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: { aspectRatio: 1, maxHeight: 280, borderRadius: Radius.card, backgroundColor: Colors.surfaceContainer },
  feedback: { gap: Spacing.sm },
});
