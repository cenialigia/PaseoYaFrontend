import { Stack } from 'expo-router';

import { Colors, FontFamily } from '@/constants/theme';

export default function ClienteLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.primary,
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { fontFamily: FontFamily.semiBold, color: Colors.onSurface },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: Colors.surface },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="comercio/[comercioId]" options={{ title: 'Tienda' }} />
      <Stack.Screen name="producto/[productoId]" options={{ title: 'Producto' }} />
      <Stack.Screen name="checkout/[carritoId]" options={{ title: 'Confirmar pedido' }} />
      <Stack.Screen name="pedido/[pedidoId]/detalle" options={{ title: 'Pedido' }} />
      <Stack.Screen name="pedido/[pedidoId]/ticket" options={{ title: 'Código de retiro' }} />
      <Stack.Screen name="cuenta" options={{ title: 'Mi cuenta' }} />
      <Stack.Screen name="notificaciones" options={{ title: 'Avisos' }} />
    </Stack>
  );
}
