import { Redirect } from 'expo-router';

import { LoadingState } from '@/components/ui/state-views';
import { rutaInicial, useAuth } from '@/state/auth';

export default function Index() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <LoadingState label="Abriendo PaseoYA" />;
  return <Redirect href={usuario ? rutaInicial(usuario.rol) : '/ingresar'} />;
}
