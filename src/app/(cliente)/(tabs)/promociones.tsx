import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { AppText } from '@/components/ui/app-text';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { getComercio, useCatalogo } from '@/data';
import { formatFechaHora } from '@/lib/format';

const TODAS = 'todas';

// CLI-23 · Promociones aprobadas y vigentes (DEC-F14-11); el precio con descuento lo calcula el servidor al confirmar.
export default function Promociones() {
  const { categorias, productos, promociones } = useCatalogo();
  const [categoria, setCategoria] = useState(TODAS);
  const conPromo = productos.filter((p) => p.descuento && (categoria === TODAS || getComercio(p.comercioId)?.categoriaId === categoria));
  const finDe = (productoId: string) => promociones.filter((x) => x.productoId === productoId).map((x) => Date.parse(x.fin)).sort((a, b) => a - b)[0];

  return (
    <Screen title="Promociones">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar por categoría">
        <FilterChip label="Todas" selected={categoria === TODAS} onPress={() => setCategoria(TODAS)} />
        {categorias.map((c) => (
          <FilterChip key={c.id} label={c.nombre} selected={categoria === c.id} onPress={() => setCategoria(c.id)} />
        ))}
      </ScrollView>
      {conPromo.length === 0 ? (
        <EmptyState title="No hay promociones aquí" message="Vuelve pronto: las tiendas publican ofertas nuevas." />
      ) : (
        conPromo.map((p) => (
          <View key={p.id}>
            <ProductCard producto={p} />
            {finDe(p.id) ? (
              <AppText variant="caption" color="onSurfaceVariant" style={styles.vigencia}>
                Válida hasta el {formatFechaHora(finDe(p.id))}
              </AppText>
            ) : null}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm },
  vigencia: { marginTop: Spacing.xs, marginLeft: Spacing.xs },
});
