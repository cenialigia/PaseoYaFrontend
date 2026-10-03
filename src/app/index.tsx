import { Redirect } from 'expo-router';

import { rutaInicial, useAuth } from '@/state/auth';

export default function Index() {
  const { usuario } = useAuth();
  return <Redirect href={usuario ? rutaInicial(usuario.rol) : '/ingresar'} />;
}
