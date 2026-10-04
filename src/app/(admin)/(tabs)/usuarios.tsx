import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AdminHeader } from '@/components/admin-header';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { FilterChip, StatusChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { etiquetaRol, listarUsuarios, type UsuarioAdmin } from '@/data/admin';
import { normalizeSearch } from '@/lib/format';
import type { Rol } from '@/state/auth';

// ADM-04 · Usuarios por rol y estado. El correo viene de una función de servidor sólo para el admin.
export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null);
  const [error, setError] = useState(false);
  const [texto, setTexto] = useState('');
  const [rol, setRol] = useState<Rol | 'todos'>('todos');
  const [soloInactivos, setSoloInactivos] = useState(false);

  const cargar = useCallback(() => {
    let activo = true;
    listarUsuarios().then((r) => {
      if (!activo) return;
      setError(r === null);
      if (r) setUsuarios(r);
    });
    return () => {
      activo = false;
    };
  }, []);
  useFocusEffect(cargar);

  const header = <AdminHeader title="Usuarios" />;
  if (error && !usuarios) return <ErrorState title="No se pudieron cargar los usuarios" onAction={cargar} />;
  if (!usuarios) return <LoadingState label="Cargando usuarios" />;

  const q = normalizeSearch(texto);
  const visibles = usuarios.filter(
    (u) => (rol === 'todos' || u.rol === rol) && (!soloInactivos || !u.activo) && (!q || normalizeSearch(`${u.nombre} ${u.email}`).includes(q)),
  );
  const contar = (r: Rol) => usuarios.filter((u) => u.rol === r).length;

  return (
    <Screen header={header}>
      <SearchField value={texto} onChangeText={setTexto} placeholder="Buscar por nombre o correo" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar por rol">
        <FilterChip label={`Todos (${usuarios.length})`} selected={rol === 'todos'} onPress={() => setRol('todos')} />
        <FilterChip label={`Clientes (${contar('CLIENTE')})`} selected={rol === 'CLIENTE'} onPress={() => setRol('CLIENTE')} />
        <FilterChip label={`Comercios (${contar('COMERCIO')})`} selected={rol === 'COMERCIO'} onPress={() => setRol('COMERCIO')} />
        <FilterChip label={`Administración (${contar('ADMIN')})`} selected={rol === 'ADMIN'} onPress={() => setRol('ADMIN')} />
        <FilterChip label="Sólo inactivos" selected={soloInactivos} onPress={() => setSoloInactivos(!soloInactivos)} />
      </ScrollView>
      {visibles.length === 0 ? (
        <EmptyState title={q ? 'Sin resultados' : 'Sin usuarios en esta lista'} />
      ) : (
        visibles.map((u) => (
          <Card
            key={u.id}
            onPress={() => router.push({ pathname: '/usuario/[usuarioId]', params: { usuarioId: u.id } })}
            accessibilityLabel={`${u.nombre}, ${etiquetaRol[u.rol]}, ${u.activo ? 'activo' : 'inactivo'}, ${u.email}`}>
            <View style={styles.fila}>
              <AppText variant="titleSm" style={styles.flex}>
                {u.nombre}
              </AppText>
              <StatusChip label={u.activo ? etiquetaRol[u.rol] : 'Inactivo'} tone={!u.activo ? 'cerrado' : u.rol === 'ADMIN' ? 'preparando' : u.rol === 'COMERCIO' ? 'confirmado' : 'listo'} />
            </View>
            <AppText variant="bodySm" color="onSurfaceVariant">
              {u.email}
              {u.comercio ? ` · ${u.comercio}` : ''}
            </AppText>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
});
