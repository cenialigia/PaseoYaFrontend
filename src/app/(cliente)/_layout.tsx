import { Redirect, Stack } from 'expo-router';

import { CatalogoGate } from '@/components/catalogo-gate';
import { Colors, FontFamily } from '@/constants/theme';
import { useAuth } from '@/state/auth';

export default function ClienteLayout() {
  const { usuario } = useAuth();
  // Comodidad de interfaz: la autorización real la impone el backend (DEC-10).
  if (usuario?.rol !== 'CLIENTE') return <Redirect href="/" />;
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
        <Stack.Screen name="buscar" options={{ title: 'Buscar' }} />
        <Stack.Screen name="carritos" options={{ title: 'Mi carrito' }} />
        <Stack.Screen name="categoria/[categoriaId]" options={{ title: 'Categoría' }} />
        <Stack.Screen name="comercio/[comercioId]" options={{ title: 'Tienda' }} />
        <Stack.Screen name="producto/[productoId]" options={{ title: 'Producto' }} />
        <Stack.Screen name="checkout/[carritoId]" options={{ title: 'Método de pago' }} />
        <Stack.Screen name="pago-qr/[pedidoId]" options={{ title: 'Pagar con QR' }} />
        <Stack.Screen name="pago-confirmado/[pedidoId]" options={{ title: '', headerBackVisible: false }} />
        <Stack.Screen name="reserva-confirmada/[pedidoId]" options={{ title: '', headerBackVisible: false }} />
        <Stack.Screen name="pedido/[pedidoId]/detalle" options={{ title: 'Pedido' }} />
        <Stack.Screen name="pedido/[pedidoId]/ticket" options={{ title: 'Ticket de recojo' }} />
        <Stack.Screen name="favoritos" options={{ title: 'Mis favoritos' }} />
        <Stack.Screen name="notificaciones" options={{ title: 'Notificaciones' }} />
        <Stack.Screen name="foto-perfil" options={{ headerShown: false }} />
        <Stack.Screen name="datos-personales" options={{ title: 'Información personal' }} />
        <Stack.Screen name="reportar" options={{ title: 'Reportar un problema' }} />
        <Stack.Screen name="ayuda" options={{ title: 'Ayuda' }} />
      </Stack>
    </CatalogoGate>
  );
}
