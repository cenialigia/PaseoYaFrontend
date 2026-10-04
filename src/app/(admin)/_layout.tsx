import { Redirect, Stack } from 'expo-router';

import { CatalogoGate } from '@/components/catalogo-gate';
import { Colors, FontFamily } from '@/constants/theme';
import { useAuth } from '@/state/auth';

export default function AdminLayout() {
  const { usuario } = useAuth();
  // Comodidad de interfaz: el acceso global del admin lo concede el backend (DEC-10).
  if (usuario?.rol !== 'ADMIN') return <Redirect href="/" />;
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
        <Stack.Screen name="comercio-admin/[comercioId]" options={{ title: 'Detalle del comercio' }} />
        <Stack.Screen name="nuevo-comercio" options={{ title: 'Nuevo comercio' }} />
        <Stack.Screen name="editar-comercio-admin/[comercioId]" options={{ title: 'Editar comercio' }} />
        <Stack.Screen name="producto-admin/[productoId]" options={{ title: 'Producto' }} />
        <Stack.Screen name="usuario/[usuarioId]" options={{ title: 'Detalle del usuario' }} />
        <Stack.Screen name="pedido-admin/[pedidoId]" options={{ title: 'Detalle del pedido' }} />
        <Stack.Screen name="analitica" options={{ title: 'Analítica' }} />
        <Stack.Screen name="categorias" options={{ title: 'Categorías' }} />
        <Stack.Screen name="categoria-form/[categoriaId]" options={{ title: 'Categoría' }} />
        <Stack.Screen name="promociones-admin" options={{ title: 'Promociones' }} />
        <Stack.Screen name="promocion-form/[promocionId]" options={{ title: 'Promoción' }} />
        <Stack.Screen name="reportes" options={{ title: 'Reportes de clientes' }} />
        <Stack.Screen name="auditoria" options={{ title: 'Auditoría' }} />
        <Stack.Screen name="perfil-admin" options={{ title: 'Mi perfil' }} />
        <Stack.Screen name="avisos-admin" options={{ title: 'Avisos' }} />
        <Stack.Screen name="ayuda-admin" options={{ title: 'Ayuda' }} />
      </Stack>
    </CatalogoGate>
  );
}
