import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip, StatusChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { comercios, productos } from '@/fixtures';

const TODAS = 'Todas';
const categorias = [TODAS, ...Array.from(new Set(comercios.map((c) => c.categoria)))];

export default function Explorar() {
  const [categoria, setCategoria] = useState(TODAS);
  const tiendas = categoria === TODAS ? comercios : comercios.filter((c) => c.categoria === categoria);
  const idsTiendas = new Set(tiendas.map((c) => c.id));
  const ofertas = productos.filter((p) => p.precioAnterior && idsTiendas.has(p.comercioId));

  return (
    <Screen title="Explorar">
      <View style={styles.notice}>
        <AppText variant="bodySm" color="onPrimaryFixedVariant">
          Todos los pedidos se retiran en persona en el local del comercio.
        </AppText>
      </View>

      <Button label="Buscar y comparar productos" variant="outline" onPress={() => router.navigate('/comparar')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Categorías">
        {categorias.map((c) => (
          <FilterChip key={c} label={c} selected={categoria === c} onPress={() => setCategoria(c)} />
        ))}
      </ScrollView>

      <Section title="Tiendas">
        {tiendas.map((c) => (
          <Card
            key={c.id}
            onPress={() => router.push({ pathname: '/comercio/[comercioId]', params: { comercioId: c.id } })}
            accessibilityLabel={`${c.nombre}, ${c.categoria}, ${c.local}, ${c.piso}, ${c.abierto ? 'abierto' : 'cerrado'}`}>
            <View style={styles.placeholder} />
            <View style={styles.row}>
              <AppText variant="titleSm">{c.nombre}</AppText>
              <StatusChip label={c.abierto ? 'Abierto' : 'Cerrado'} tone={c.abierto ? 'listo' : 'cerrado'} />
            </View>
            <AppText variant="bodySm" color="onSurfaceVariant">
              {c.categoria} · {c.local} · {c.piso}
            </AppText>
          </Card>
        ))}
      </Section>

      <Section title="Ofertas">
        {ofertas.length === 0 ? (
          <EmptyState title="Sin ofertas en esta categoría" message="Revise otras categorías o vuelva más tarde." />
        ) : (
          ofertas.map((p) => <ProductCard key={p.id} producto={p} />)
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md },
  chips: { gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  // Placeholder sin marca (DEC-15): sustituye a las fotos de Stitch.
  placeholder: { height: 96, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainer },
});
