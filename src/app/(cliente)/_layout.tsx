import { Redirect, Stack } from 'expo-router';

import { Colors, FontFamily } from '@/constants/theme';
import { useAuth } from '@/state/auth';

export default function ClienteLayout() {
  const { usuario } = useAuth();
  // Comodidad de interfaz: la autorización real la impone el backend (DEC-10).
  if (usuario?.rol !== 'CLIENTE') return <Redirect href="/" />;
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
      <Stack.Screen name="cuenta" options={{ title: 'Mi perfil' }} />
    </Stack>
  );
}
