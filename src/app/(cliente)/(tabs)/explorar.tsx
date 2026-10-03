import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen, Section } from '@/components/ui/screen';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { comercios, getComercio, productos } from '@/fixtures';

export default function Explorar() {
  const ofertas = productos.filter((p) => p.precioAnterior);

  return (
    <Screen title="Explorar">
      <View style={styles.notice}>
        <AppText variant="bodySm" color="onPrimaryFixedVariant">
          Todos los pedidos se retiran en persona en el local del comercio.
        </AppText>
      </View>

      <Section title="Tiendas">
        {comercios.map((c) => (
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
        {ofertas.map((p) => (
          <Card
            key={p.id}
            onPress={() => router.push({ pathname: '/producto/[productoId]', params: { productoId: p.id } })}
            accessibilityLabel={`${p.nombre}, de ${getComercio(p.comercioId)?.nombre}`}>
            <AppText variant="titleSm">{p.nombre}</AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              {getComercio(p.comercioId)?.nombre}
            </AppText>
            <PriceText amount={p.precio} previous={p.precioAnterior} />
            {p.stock <= 2 ? (
              <AppText variant="labelSm" color="onTertiaryFixedVariant">
                {p.stock === 0 ? 'Agotado' : `Últimas ${p.stock} unidades`}
              </AppText>
            ) : null}
          </Card>
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  // Placeholder sin marca (DEC-15): sustituye a las fotos de Stitch.
  placeholder: { height: 96, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainer },
});
