import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { CatalogoProvider } from '@/data/catalogo';
import { AuthProvider, useAuth } from '@/state/auth';
import { CartProvider } from '@/state/cart';
import { FavoritosProvider } from '@/state/favoritos';
import { NotificacionesProvider } from '@/state/notificaciones';
import { OrdersProvider } from '@/state/orders';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: Colors.primary, background: Colors.surface, card: Colors.surface, text: Colors.onSurface, border: Colors.outlineVariant },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <DatosDeSesion />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Catálogo, carrito y pedidos se remontan al cambiar de usuario para no mezclar datos entre cuentas.
function DatosDeSesion() {
  const { usuario } = useAuth();
  return (
    <CatalogoProvider key={usuario?.id ?? 'sin-sesion'}>
      <CartProvider>
        <OrdersProvider>
          <FavoritosProvider>
            <NotificacionesProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }} />
            </NotificacionesProvider>
          </FavoritosProvider>
        </OrdersProvider>
      </CartProvider>
    </CatalogoProvider>
  );
}
