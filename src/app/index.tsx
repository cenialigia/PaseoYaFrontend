import { Redirect } from 'expo-router';

// Hasta LUI-07 no hay sesión ni roles: se entra directo al área cliente.
export default function Index() {
  return <Redirect href="/explorar" />;
}
