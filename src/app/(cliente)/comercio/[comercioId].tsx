import { router, Stack, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen, Section } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { getComercio, productos } from '@/fixtures';

export default function ComercioScreen() {
  const { comercioId } = useLocalSearchParams<{ comercioId: string }>();
  const comercio = getComercio(comercioId);

  if (!comercio) return <ErrorState title="Tienda no encontrada" actionLabel="Volver" onAction={() => router.back()} />;

  return (
    <Screen>
      <Stack.Screen options={{ title: comercio.nombre }} />
      <StatusChip label={comercio.abierto ? 'Abierto' : 'Cerrado'} tone={comercio.abierto ? 'listo' : 'cerrado'} />
      <AppText variant="body" color="onSurfaceVariant">
        {comercio.categoria} · {comercio.local} · {comercio.piso}
      </AppText>
      <Section title="Productos">
        {productos
          .filter((p) => p.comercioId === comercio.id)
          .map((p) => (
            <Card key={p.id} onPress={() => router.push({ pathname: '/producto/[productoId]', params: { productoId: p.id } })} accessibilityLabel={p.nombre}>
              <AppText variant="titleSm">{p.nombre}</AppText>
              <PriceText amount={p.precio} previous={p.precioAnterior} />
            </Card>
          ))}
      </Section>
    </Screen>
  );
}
