import { router, Stack, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { getComercio, getProducto } from '@/fixtures';

export default function ProductoScreen() {
  const { productoId } = useLocalSearchParams<{ productoId: string }>();
  const producto = getProducto(productoId);
  const comercio = producto && getComercio(producto.comercioId);

  if (!producto || !comercio) return <ErrorState title="Producto no encontrado" actionLabel="Volver" onAction={() => router.back()} />;

  return (
    <Screen>
      <Stack.Screen options={{ title: producto.nombre }} />
      <AppText variant="headline">{producto.nombre}</AppText>
      <AppText variant="body" color="onSurfaceVariant">
        {comercio.nombre} · {comercio.local} · {comercio.piso}
      </AppText>
      <PriceText amount={producto.precio} previous={producto.precioAnterior} variant="title" />
      <AppText variant="label" color={producto.stock === 0 ? 'error' : 'secondary'}>
        {producto.stock === 0 ? 'Agotado' : `${producto.stock} ${producto.stock === 1 ? 'disponible' : 'disponibles'}`}
      </AppText>
      {/* Agregar al carrito llega en LUI-03/04; se deshabilita para no simular una acción inexistente. */}
      <Button label="Agregar al carrito" disabled accessibilityHint="Disponible en una próxima versión" />
    </Screen>
  );
}
