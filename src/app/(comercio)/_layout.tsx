import { Redirect, Stack } from 'expo-router';

import { Colors, FontFamily } from '@/constants/theme';
import { useAuth } from '@/state/auth';

export default function ComercioLayout() {
  const { usuario } = useAuth();
  // Comodidad de interfaz: el backend limita al comercio a su propio comercio_id (DEC-10).
  if (usuario?.rol !== 'COMERCIO' || !usuario.comercioId) return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.primary,
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { fontFamily: FontFamily.semiBold, color: Colors.onSurface },
        contentStyle: { backgroundColor: Colors.surface },
      }}
    />
  );
}
