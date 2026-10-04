import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { Visual } from '@/components/producto-visual';
import { AppText } from '@/components/ui/app-text';
import { StatusChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getComercio, useCatalogo } from '@/data';
import { normalizeSearch } from '@/lib/format';

// CLI-08 · Tienda: cabecera, ubicación, buscador interno y productos con su carrito.
export default function ComercioScreen() {
  const { comercioId } = useLocalSearchParams<{ comercioId: string }>();
  const { productos } = useCatalogo();
  const [consulta, setConsulta] = useState('');
  const comercio = getComercio(comercioId);

  if (!comercio) return <ErrorState title="Tienda no encontrada" actionLabel="Volver" onAction={() => router.back()} />;

  const termino = normalizeSearch(consulta);
  const catalogo = productos.filter((p) => p.comercioId === comercio.id && (!termino || normalizeSearch(p.nombre).includes(termino)));

  return (
    <Screen>
      <Stack.Screen options={{ title: comercio.nombre }} />
      <View style={styles.cabecera}>
        <Visual url={comercio.imagenUrl} icono="storefront" alto={64} estilo={styles.logo} />
        <View style={styles.flex}>
          <AppText variant="title">{comercio.nombre}</AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {comercio.piso} · {comercio.local}
          </AppText>
          {comercio.descripcion ? (
            <AppText variant="caption" color="onSurfaceVariant">
              {comercio.descripcion}
            </AppText>
          ) : null}
        </View>
        <StatusChip label={comercio.abierto ? 'Abierta' : 'Cerrada'} tone={comercio.abierto ? 'listo' : 'cerrado'} />
      </View>
      {!comercio.abierto ? (
        <View style={styles.cerrado} accessibilityRole="alert">
          <AppText variant="bodySm" color="onErrorContainer">
            La tienda está cerrada. Puedes ver su catálogo, pero no agregar productos al carrito.
          </AppText>
        </View>
      ) : null}
      <SearchField value={consulta} onChangeText={setConsulta} placeholder={`Buscar en ${comercio.nombre}`} />
      {catalogo.length === 0 ? (
        <EmptyState title={termino ? 'Sin resultados' : 'Esta tienda aún no publica productos'} />
      ) : (
        catalogo.map((p) => <ProductCard key={p.id} producto={p} mostrarComercio={false} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexWrap: 'wrap' },
  logo: { width: 64 },
  flex: { flex: 1, gap: 2, minWidth: 160 },
  cerrado: { backgroundColor: Colors.errorContainer, borderRadius: Radius.control, padding: Spacing.md },
});
