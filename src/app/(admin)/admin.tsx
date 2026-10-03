import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { comercios, estadoPedidoUI, getComercio, totalLineas, type EstadoPedido } from '@/fixtures';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/state/auth';
import { useOrders } from '@/state/orders';

const ESTADOS: EstadoPedido[] = ['CONFIRMED', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED', 'EXPIRED'];

// LUI-09 mínimo para la demo: supervisión de sólo lectura.
export default function AdminScreen() {
  const { salir } = useAuth();
  const { pedidos, reportes } = useOrders();
  const ventas = pedidos.filter((p) => p.estado === 'DELIVERED').reduce((s, p) => s + totalLineas(p.lineas), 0);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Administración', headerRight: () => <Button label="Salir" variant="ghost" onPress={salir} /> }} />
      <View style={styles.kpi} accessible accessibilityLabel={`Ventas entregadas en la plaza: ${formatPrice(ventas)}`}>
        <AppText variant="label" color="onPrimaryFixedVariant">
          Ventas entregadas · Paseo Aranjuez
        </AppText>
        <AppText variant="title" color="primary">
          {formatPrice(ventas)}
        </AppText>
      </View>

      <Section title="Pedidos por estado">
        <View style={styles.grid}>
          {ESTADOS.map((e) => (
            <View key={e} style={styles.cell} accessible accessibilityLabel={`${estadoPedidoUI[e].etiqueta}: ${pedidos.filter((p) => p.estado === e).length}`}>
              <StatusChip label={estadoPedidoUI[e].etiqueta} tone={estadoPedidoUI[e].tono} />
              <AppText variant="title">{pedidos.filter((p) => p.estado === e).length}</AppText>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Comercios">
        {comercios.map((c) => {
          const propios = pedidos.filter((p) => p.comercioId === c.id);
          return (
            <Card key={c.id} accessibilityLabel={`${c.nombre}, ${c.abierto ? 'abierto' : 'cerrado'}, ${propios.length} pedidos`}>
              <View style={styles.row}>
                <AppText variant="titleSm">{c.nombre}</AppText>
                <StatusChip label={c.abierto ? 'Abierto' : 'Cerrado'} tone={c.abierto ? 'listo' : 'cerrado'} />
              </View>
              <AppText variant="bodySm" color="onSurfaceVariant">
                {c.categoria} · {c.local} · {c.piso} · {propios.length} pedidos
              </AppText>
            </Card>
          );
        })}
      </Section>

      <Section title="Reportes de clientes">
        {reportes.length === 0 ? (
          <EmptyState title="Sin reportes" />
        ) : (
          reportes.map((r) => {
            const p = pedidos.find((x) => x.id === r.pedidoId);
            return (
              <Card key={r.id}>
                <AppText variant="label">{p ? `${p.codigo} · ${getComercio(p.comercioId)?.nombre}` : 'Sin pedido asociado'}</AppText>
                <AppText variant="bodySm">{r.mensaje}</AppText>
              </Card>
            );
          })
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kpi: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  cell: { width: '47%', gap: Spacing.xs, padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
});
