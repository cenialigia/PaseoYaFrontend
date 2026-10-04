import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ComercioHeader } from '@/components/comercio-header';
import { PedidoComercioCard } from '@/components/pedido-comercio-card';
import { AppText } from '@/components/ui/app-text';
import { FilterChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { esVenta } from '@/data';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/state/auth';
import { useOrders } from '@/state/orders';

type Periodo = 'hoy' | '7' | '30' | 'todo';

const desde = (p: Periodo): number => {
  if (p === 'todo') return 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return p === 'hoy' ? d.getTime() : d.getTime() - (Number(p) - 1) * 86_400_000;
};

// COM-09 · Ventas: sólo pedidos con el pago hecho (DEC-F14-11), por periodo según la fecha de confirmación del pedido.
export default function VentasComercio() {
  const { usuario } = useAuth();
  const { pedidos } = useOrders();
  const [periodo, setPeriodo] = useState<Periodo>('hoy');
  const ventas = pedidos.filter((p) => p.comercioId === usuario?.comercioId && esVenta(p) && p.confirmadoEn >= desde(periodo));
  const total = ventas.reduce((s, p) => s + p.total, 0);
  const qr = ventas.filter((p) => p.pago.metodo === 'QR_SIMULADO').reduce((s, p) => s + p.total, 0);
  const promedio = ventas.length ? total / ventas.length : 0;

  const dato = (titulo: string, valor: string) => (
    <View key={titulo} style={styles.dato} accessible accessibilityLabel={`${titulo}: ${valor}`}>
      <AppText variant="labelSm" color="onSurfaceVariant">
        {titulo}
      </AppText>
      <AppText variant="titleSm" color="primary">
        {valor}
      </AppText>
    </View>
  );

  return (
    <Screen header={<ComercioHeader title="Ventas" />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Periodo">
        <FilterChip label="Hoy" selected={periodo === 'hoy'} onPress={() => setPeriodo('hoy')} />
        <FilterChip label="7 días" selected={periodo === '7'} onPress={() => setPeriodo('7')} />
        <FilterChip label="30 días" selected={periodo === '30'} onPress={() => setPeriodo('30')} />
        <FilterChip label="Todo" selected={periodo === 'todo'} onPress={() => setPeriodo('todo')} />
      </ScrollView>
      <View style={styles.total} accessible accessibilityLabel={`Total vendido: ${formatPrice(total)} en ${ventas.length} ${ventas.length === 1 ? 'pedido' : 'pedidos'}`}>
        <AppText variant="label" color="onPrimaryFixedVariant">
          Total vendido
        </AppText>
        <AppText variant="headline" color="primary">
          {formatPrice(total)}
        </AppText>
        <AppText variant="caption" color="onPrimaryFixedVariant">
          {ventas.length} {ventas.length === 1 ? 'pedido pagado' : 'pedidos pagados'}
        </AppText>
      </View>
      <View style={styles.datos}>
        {dato('Ticket promedio', formatPrice(promedio))}
        {dato('Con QR (simulado)', formatPrice(qr))}
        {dato('En efectivo', formatPrice(total - qr))}
      </View>
      <AppText variant="caption" color="onSurfaceVariant">
        No incluye reservas sin cobrar ni pedidos cancelados. Los pagos QR son simulados: no hay dinero real.
      </AppText>
      <Section title="Detalle">
        {ventas.length === 0 ? (
          <EmptyState title="Sin ventas en este periodo" />
        ) : (
          ventas.map((p) => <PedidoComercioCard key={p.id} pedido={p} destino="venta" />)
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm },
  total: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.xs },
  datos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dato: { flexGrow: 1, flexBasis: '30%', padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest, gap: 2 },
});
