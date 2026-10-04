import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AdminHeader } from '@/components/admin-header';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip, StatusChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { normalizeSearch } from '@/lib/format';
import { useOrders } from '@/state/orders';

type Estado = 'todos' | 'activos' | 'inactivos' | 'abiertos' | 'cerrados';

// ADM-02 · Comercios de la plaza (incluidos los inactivos) con búsqueda y filtros por estado y categoría.
export default function ComerciosAdmin() {
  const { comercios, categorias } = useCatalogo();
  const { pedidos } = useOrders();
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<Estado>('todos');
  const [categoria, setCategoria] = useState<string | null>(null);
  const q = normalizeSearch(texto);
  const visibles = comercios.filter(
    (c) =>
      (!q || normalizeSearch(`${c.nombre} ${c.local} ${c.piso}`).includes(q)) &&
      (!categoria || c.categoriaId === categoria) &&
      (estado === 'activos' ? c.activo : estado === 'inactivos' ? !c.activo : estado === 'abiertos' ? c.activo && c.abierto : estado === 'cerrados' ? !c.abierto : true),
  );

  return (
    <Screen header={<AdminHeader title="Comercios" />}>
      <Button label="Nuevo comercio" onPress={() => router.push('/nuevo-comercio')} />
      <SearchField value={texto} onChangeText={setTexto} placeholder="Buscar por nombre, piso o local" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar por estado">
        {(['todos', 'activos', 'inactivos', 'abiertos', 'cerrados'] as Estado[]).map((e) => (
          <FilterChip key={e} label={e[0].toUpperCase() + e.slice(1)} selected={estado === e} onPress={() => setEstado(e)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar por categoría">
        <FilterChip label="Todas las categorías" selected={!categoria} onPress={() => setCategoria(null)} />
        {categorias.map((k) => (
          <FilterChip key={k.id} label={k.nombre} selected={categoria === k.id} onPress={() => setCategoria(k.id)} />
        ))}
      </ScrollView>
      {visibles.length === 0 ? (
        <EmptyState title={q ? 'Sin resultados' : 'Sin comercios en esta lista'} />
      ) : (
        visibles.map((c) => {
          const n = pedidos.filter((p) => p.comercioId === c.id).length;
          return (
            <Card
              key={c.id}
              onPress={() => router.push({ pathname: '/comercio-admin/[comercioId]', params: { comercioId: c.id } })}
              accessibilityLabel={`${c.nombre}, ${c.activo ? (c.abierto ? 'abierto' : 'cerrado') : 'inactivo'}, ${c.categoria}, ${n} pedidos`}>
              <View style={styles.fila}>
                <AppText variant="titleSm" style={styles.flex}>
                  {c.nombre}
                </AppText>
                <StatusChip label={!c.activo ? 'Inactivo' : c.abierto ? 'Abierto' : 'Cerrado'} tone={!c.activo ? 'entregado' : c.abierto ? 'listo' : 'cerrado'} />
              </View>
              <AppText variant="bodySm" color="onSurfaceVariant">
                {c.categoria} · {c.piso} · {c.local} · {n} {n === 1 ? 'pedido' : 'pedidos'}
              </AppText>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
});
