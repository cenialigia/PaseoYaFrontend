import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { AppText } from '@/components/ui/app-text';
import { StatusChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getComercio, useCatalogo } from '@/data';

export default function ComercioScreen() {
  const { comercioId } = useLocalSearchParams<{ comercioId: string }>();
  const { productos } = useCatalogo();
  const comercio = getComercio(comercioId);

  if (!comercio) return <ErrorState title="Tienda no encontrada" actionLabel="Volver" onAction={() => router.back()} />;

  const catalogo = productos.filter((p) => p.comercioId === comercio.id);

  return (
    <Screen>
      <Stack.Screen options={{ title: comercio.nombre }} />
      <View style={styles.placeholder} />
      <StatusChip label={comercio.abierto ? 'Abierto' : 'Cerrado'} tone={comercio.abierto ? 'listo' : 'cerrado'} />
      <AppText variant="body" color="onSurfaceVariant">
        {comercio.categoria} · {comercio.local} · {comercio.piso}
      </AppText>
      {!comercio.abierto ? (
        <View style={styles.closed} accessibilityRole="alert">
          <AppText variant="bodySm" color="onErrorContainer">
            El comercio está cerrado. Puede ver su catálogo, pero no agregar productos al carrito.
          </AppText>
        </View>
      ) : null}
      <Section title="Productos">
        {catalogo.length === 0 ? (
          <EmptyState title="Sin productos publicados" />
        ) : (
          catalogo.map((p) => <ProductCard key={p.id} producto={p} mostrarComercio={false} />)
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: { height: 140, borderRadius: Radius.card, backgroundColor: Colors.surfaceContainer },
  closed: { backgroundColor: Colors.errorContainer, borderRadius: Radius.control, padding: Spacing.md },
});
