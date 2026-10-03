import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { AppText } from '@/components/ui/app-text';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { getComercio, productos } from '@/fixtures';
import { formatPrice, normalizeSearch } from '@/lib/format';

type Filtro = 'todos' | 'precio' | 'stock';

export default function Comparar() {
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const termino = normalizeSearch(consulta);
  let resultados = termino ? productos.filter((p) => normalizeSearch(p.nombre).includes(termino)) : [];
  if (filtro === 'stock') resultados = resultados.filter((p) => p.stock > 0);
  if (filtro === 'precio') resultados = [...resultados].sort((a, b) => a.precio - b.precio);

  const disponibles = resultados.filter((p) => p.stock > 0 && getComercio(p.comercioId)?.abierto);
  const masBarato = disponibles.reduce<(typeof disponibles)[number] | undefined>((min, p) => (!min || p.precio < min.precio ? p : min), undefined);
  const nComercios = new Set(resultados.map((p) => p.comercioId)).size;

  return (
    <Screen title="Comparar">
      <View style={styles.searchRow}>
        <TextInput
          value={consulta}
          onChangeText={setConsulta}
          placeholder="Buscar un producto"
          placeholderTextColor={Colors.onSurfaceVariant}
          accessibilityLabel="Buscar un producto"
          returnKeyType="search"
          style={styles.input}
        />
        {consulta ? <FilterChip label="Limpiar" selected={false} onPress={() => setConsulta('')} /> : null}
      </View>
      <View style={styles.chips}>
        <FilterChip label="Todos" selected={filtro === 'todos'} onPress={() => setFiltro('todos')} />
        <FilterChip label="Menor precio" selected={filtro === 'precio'} onPress={() => setFiltro('precio')} />
        <FilterChip label="Con stock" selected={filtro === 'stock'} onPress={() => setFiltro('stock')} />
      </View>

      {!termino ? (
        <EmptyState title="Busque un producto" message="Verá productos similares de varios comercios, con su precio y disponibilidad." />
      ) : resultados.length === 0 ? (
        <EmptyState title="Sin resultados" message="Pruebe con otro nombre o quite el filtro." />
      ) : (
        <>
          <View style={styles.summary}>
            <AppText variant="label">
              {resultados.length} {resultados.length === 1 ? 'producto' : 'productos'} en {nComercios} {nComercios === 1 ? 'comercio' : 'comercios'}
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              {masBarato
                ? `Menor precio disponible: ${formatPrice(masBarato.precio)} en ${getComercio(masBarato.comercioId)?.nombre}`
                : 'Ninguno está disponible ahora.'}
            </AppText>
            {/* DEC-09: no se afirma equivalencia entre productos de distintos comercios. */}
            <AppText variant="caption" color="onSurfaceVariant">
              Los productos se muestran por coincidencia de nombre; compruebe que son el mismo modelo antes de comprar.
            </AppText>
          </View>
          {resultados.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: {
    ...Typography.body,
    flex: 1,
    minHeight: TouchTarget,
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    color: Colors.onSurface,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  summary: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.xs },
});
