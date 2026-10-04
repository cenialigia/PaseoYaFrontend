import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { TiendaCard } from '@/components/tienda-card';
import { AppText } from '@/components/ui/app-text';
import { FilterChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { normalizeSearch } from '@/lib/format';

type Filtro = 'todos' | 'precio' | 'stock';

// Búsqueda global (DEC-09: la comparación la hace el cliente viendo las opciones de varias tiendas).
export default function Buscar() {
  const { comercios, productos } = useCatalogo();
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const termino = normalizeSearch(consulta);
  const tiendas = termino ? comercios.filter((c) => normalizeSearch(c.nombre).includes(termino) || normalizeSearch(c.categoria).includes(termino)) : [];
  let resultados = termino ? productos.filter((p) => normalizeSearch(p.nombre).includes(termino)) : [];
  if (filtro === 'stock') resultados = resultados.filter((p) => p.stock > 0);
  if (filtro === 'precio') resultados = [...resultados].sort((a, b) => a.precio - b.precio);
  const nTiendas = new Set(resultados.map((p) => p.comercioId)).size;

  return (
    <Screen>
      <SearchField value={consulta} onChangeText={setConsulta} placeholder="Buscar productos o tiendas" autoFocus />
      <View style={styles.chips}>
        <FilterChip label="Todos" selected={filtro === 'todos'} onPress={() => setFiltro('todos')} />
        <FilterChip label="Menor precio" selected={filtro === 'precio'} onPress={() => setFiltro('precio')} />
        <FilterChip label="Con stock" selected={filtro === 'stock'} onPress={() => setFiltro('stock')} />
      </View>
      {!termino ? (
        <EmptyState title="¿Qué estás buscando?" message="Verás las opciones de varias tiendas con su precio y disponibilidad." />
      ) : resultados.length === 0 && tiendas.length === 0 ? (
        <EmptyState title="Sin resultados" message="Prueba con otro nombre o quita el filtro." />
      ) : (
        <>
          {tiendas.length > 0 ? (
            <Section title="Tiendas">
              {tiendas.map((c) => (
                <TiendaCard key={c.id} comercio={c} />
              ))}
            </Section>
          ) : null}
          {resultados.length > 0 ? (
            <Section title="Productos">
              <AppText variant="label" accessibilityLiveRegion="polite">
                {resultados.length} {resultados.length === 1 ? 'opción' : 'opciones'} en {nTiendas} {nTiendas === 1 ? 'tienda' : 'tiendas'}
              </AppText>
              {resultados.map((p) => (
                <ProductCard key={p.id} producto={p} />
              ))}
            </Section>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
