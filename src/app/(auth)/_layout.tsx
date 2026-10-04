import { Redirect, Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { rutaInicial, useAuth } from '@/state/auth';

export default function AuthLayout() {
  const { usuario, pendienteFoto } = useAuth();
  if (usuario) return <Redirect href={rutaInicial(usuario.rol, pendienteFoto)} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surface } }} />;
}
