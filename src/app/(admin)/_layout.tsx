import { Redirect, Stack } from 'expo-router';

import { Colors, FontFamily } from '@/constants/theme';
import { useAuth } from '@/state/auth';

export default function AdminLayout() {
  const { usuario } = useAuth();
  // Comodidad de interfaz: el acceso global del admin lo concede el backend (DEC-10).
  if (usuario?.rol !== 'ADMIN') return <Redirect href="/" />;
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
