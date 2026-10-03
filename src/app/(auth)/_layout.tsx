import { Redirect, Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { rutaInicial, useAuth } from '@/state/auth';

export default function AuthLayout() {
  const { usuario } = useAuth();
  if (usuario) return <Redirect href={rutaInicial(usuario.rol)} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surface } }} />;
}
