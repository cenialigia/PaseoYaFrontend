import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { getComercio, productos } from '@/fixtures';
import { normalizeSearch } from '@/lib/format';

type Filtro = 'todos' | 'precio' | 'stock';

export default function Comparar() {
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const termino = normalizeSearch(consulta);
  let resultados = termino ? productos.filter((p) => normalizeSearch(p.nombre).includes(termino)) : [];
  if (filtro === 'stock') resultados = resultados.filter((p) => p.stock > 0);
  if (filtro === 'precio') resultados = [...resultados].sort((a, b) => a.precio - b.precio);

  return (
    <Screen title="Comparar">
      <TextInput
        value={consulta}
        onChangeText={setConsulta}
        placeholder="Buscar un producto"
        placeholderTextColor={Colors.onSurfaceVariant}
        accessibilityLabel="Buscar un producto"
        returnKeyType="search"
        style={styles.input}
      />
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
        resultados.map((p) => {
          const c = getComercio(p.comercioId);
          return (
            <Card
              key={p.id}
              onPress={() => router.push({ pathname: '/producto/[productoId]', params: { productoId: p.id } })}
              accessibilityLabel={`${p.nombre}, en ${c?.nombre}`}>
              <AppText variant="titleSm">{p.nombre}</AppText>
              <AppText variant="bodySm" color="onSurfaceVariant">
                {c?.nombre} · {c?.local} · {c?.piso}
              </AppText>
              <PriceText amount={p.precio} previous={p.precioAnterior} />
              <AppText variant="labelSm" color={p.stock === 0 ? 'error' : 'secondary'}>
                {p.stock === 0 ? 'Agotado' : `${p.stock} ${p.stock === 1 ? 'disponible' : 'disponibles'}`}
              </AppText>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    ...Typography.body,
    minHeight: TouchTarget,
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    color: Colors.onSurface,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
