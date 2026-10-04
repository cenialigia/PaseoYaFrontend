import { Redirect, Stack } from 'expo-router';

import { CatalogoGate } from '@/components/catalogo-gate';
import { Colors, FontFamily } from '@/constants/theme';
import { useAuth } from '@/state/auth';

export default function ComercioLayout() {
  const { usuario } = useAuth();
  // Comodidad de interfaz: el backend limita al comercio a su propio comercio_id (DEC-10).
  if (usuario?.rol !== 'COMERCIO' || !usuario.comercioId) return <Redirect href="/" />;
  return (
    <CatalogoGate>
      <Stack
        screenOptions={{
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.surface },
          headerTitleStyle: { fontFamily: FontFamily.semiBold, color: Colors.onSurface },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: Colors.surface },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="orden/[pedidoId]" options={{ title: 'Detalle del pedido' }} />
        <Stack.Screen name="retiro" options={{ title: 'Gestionar retiro' }} />
        <Stack.Screen name="producto-comercio/[productoId]" options={{ title: 'Detalle del producto' }} />
        <Stack.Screen name="editar-producto/[productoId]" options={{ title: 'Producto' }} />
        <Stack.Screen name="nueva-promocion/[productoId]" options={{ title: 'Nueva promoción' }} />
        <Stack.Screen name="promociones-comercio" options={{ title: 'Mis promociones' }} />
        <Stack.Screen name="venta/[pedidoId]" options={{ title: 'Detalle de la venta' }} />
        <Stack.Screen name="mi-comercio" options={{ title: 'Perfil de la tienda' }} />
        <Stack.Screen name="editar-comercio" options={{ title: 'Editar establecimiento' }} />
        <Stack.Screen name="avisos" options={{ title: 'Avisos' }} />
        <Stack.Screen name="ayuda-comercio" options={{ title: 'Ayuda' }} />
      </Stack>
    </CatalogoGate>
  );
}
