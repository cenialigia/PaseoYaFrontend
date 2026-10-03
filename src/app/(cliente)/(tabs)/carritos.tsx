import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen, Section } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { getComercio, totalLineas, type Carrito } from '@/fixtures';
import { useNow } from '@/hooks/use-now';
import { formatRemaining } from '@/lib/format';
import { useCart } from '@/state/cart';

export default function Carritos() {
  const ahora = useNow();
  const { carritos } = useCart();
  const activos = carritos.filter((c) => c.expiraEn > ahora);
  const vencidos = carritos.filter((c) => c.expiraEn <= ahora);

  return (
    <Screen title="Carritos">
      <AppText variant="bodySm" color="onSurfaceVariant">
        Cada comercio tiene su propio carrito y se paga por separado.
      </AppText>
      {activos.length === 0 ? (
        <EmptyState title="No tiene carritos activos" message="Agregue productos desde Explorar o Comparar." actionLabel="Ir a Explorar" onAction={() => router.navigate('/explorar')} />
      ) : (
        activos.map((c) => <CartCard key={c.id} carrito={c} ahora={ahora} />)
      )}
      {vencidos.length > 0 ? (
        <Section title="Vencidos">
          {vencidos.map((c) => (
            <CartCard key={c.id} carrito={c} ahora={ahora} />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}

function CartCard({ carrito, ahora }: { carrito: Carrito; ahora: number }) {
  const comercio = getComercio(carrito.comercioId);
  const vencido = carrito.expiraEn <= ahora;
  const unidades = carrito.lineas.reduce((n, l) => n + l.cantidad, 0);

  return (
    <Card accessibilityLabel={`Carrito de ${comercio?.nombre}`}>
      <View style={styles.row}>
        <AppText variant="titleSm">{comercio?.nombre}</AppText>
        {vencido ? <StatusChip label="Vencido" tone="cerrado" /> : null}
      </View>
      <AppText variant="bodySm" color="onSurfaceVariant">
        {comercio?.local} · {comercio?.piso} · {unidades} {unidades === 1 ? 'artículo' : 'artículos'}
      </AppText>
      {!vencido ? (
        <AppText variant="labelSm" color="onTertiaryFixedVariant" accessibilityLabel={`El carrito vence en ${formatRemaining(carrito.expiraEn - ahora)}`}>
          Vence en {formatRemaining(carrito.expiraEn - ahora)}
        </AppText>
      ) : null}
      <PriceText amount={totalLineas(carrito.lineas)} />
      {!vencido ? (
        <Button label="Ir a pagar" onPress={() => router.push({ pathname: '/checkout/[carritoId]', params: { carritoId: carrito.id } })} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
});
