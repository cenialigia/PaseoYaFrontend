import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AdminHeader } from '@/components/admin-header';
import { GraficoBarras, ventasPorDia } from '@/components/grafico-barras';
import { PedidoComercioCard } from '@/components/pedido-comercio-card';
import { AppText } from '@/components/ui/app-text';
import { StatusChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { esVenta, estadoPedidoUI, useCatalogo, type EstadoPedido } from '@/data';
import { listarPromocionesAdmin, listarUsuarios } from '@/data/admin';
import { useNow } from '@/hooks/use-now';
import { formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

const ESTADOS: EstadoPedido[] = ['CONFIRMED', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED', 'EXPIRED'];

const inicioDelDia = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// ADM-01 · Inicio del admin: totales globales con datos reales (RLS de admin) y accesos a lo pendiente.
export default function AdminInicio() {
  const { pedidos } = useOrders();
  const { comercios } = useCatalogo();
  const [usuarios, setUsuarios] = useState<number | null>(null);
  const [porRevisar, setPorRevisar] = useState(0);
  const ahora = useNow();

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      Promise.all([listarUsuarios(), listarPromocionesAdmin()]).then(([u, p]) => {
        if (!activo) return;
        setUsuarios(u ? u.length : null);
        setPorRevisar(p ? p.filter((x) => x.estado === 'PENDIENTE').length : 0);
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  const hoy = pedidos.filter((p) => p.confirmadoEn >= inicioDelDia());
  const ventasHoy = hoy.filter(esVenta).reduce((s, p) => s + p.total, 0);
  const activosComercio = comercios.filter((c) => c.activo).length;

  const kpi = (titulo: string, valor: string, icono: keyof typeof MaterialIcons.glyphMap, destino: () => void) => (
    <Pressable key={titulo} accessibilityRole="button" accessibilityLabel={`${titulo}: ${valor}`} onPress={destino} style={styles.kpi}>
      <MaterialIcons name={icono} size={24} color={Colors.primary} />
      <AppText variant="title" color="primary">
        {valor}
      </AppText>
      <AppText variant="labelSm" color="onSurfaceVariant">
        {titulo}
      </AppText>
    </Pressable>
  );

  return (
    <Screen header={<AdminHeader title="Inicio" />}>
      <View style={styles.ventas} accessible accessibilityLabel={`Ventas de hoy en la plaza: ${formatPrice(ventasHoy)}, ${hoy.length} pedidos hoy`}>
        <AppText variant="label" color="onPrimaryFixedVariant">
          Ventas de hoy · Paseo Aranjuez
        </AppText>
        <AppText variant="headline" color="primary">
          {formatPrice(ventasHoy)}
        </AppText>
        <AppText variant="caption" color="onPrimaryFixedVariant">
          {hoy.length} {hoy.length === 1 ? 'pedido hoy' : 'pedidos hoy'} · sólo cuenta lo pagado
        </AppText>
      </View>

      <GraficoBarras titulo="Ventas de la semana" barras={ventasPorDia(pedidos, 7, ahora)} />

      {porRevisar > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/promociones-admin')} style={styles.alerta}>
          <MaterialIcons name="local-offer" size={24} color={Colors.onTertiaryFixedVariant} />
          <AppText variant="label" color="onTertiaryFixedVariant" style={styles.flex}>
            {porRevisar} {porRevisar === 1 ? 'promoción espera' : 'promociones esperan'} tu revisión
          </AppText>
          <MaterialIcons name="chevron-right" size={24} color={Colors.onTertiaryFixedVariant} />
        </Pressable>
      ) : null}

      <View style={styles.kpis}>
        {kpi('Comercios activos', `${activosComercio}/${comercios.length}`, 'storefront', () => router.push('/comercios-admin'))}
        {kpi('Usuarios', usuarios === null ? '—' : String(usuarios), 'group', () => router.push('/usuarios'))}
        {kpi('Pedidos totales', String(pedidos.length), 'receipt-long', () => router.push('/pedidos-admin'))}
        {kpi('Analítica', 'Ver', 'insights', () => router.push('/analitica'))}
      </View>

      <Section title="Pedidos por estado">
        <View style={styles.kpis}>
          {ESTADOS.map((e) => {
            const n = pedidos.filter((p) => p.estado === e).length;
            return (
              <View key={e} style={styles.celda} accessible accessibilityLabel={`${estadoPedidoUI[e].etiqueta}: ${n}`}>
                <StatusChip label={estadoPedidoUI[e].etiqueta} tone={estadoPedidoUI[e].tono} />
                <AppText variant="title">{n}</AppText>
              </View>
            );
          })}
        </View>
      </Section>

      <Section title="Pedidos recientes">
        {pedidos.length === 0 ? (
          <EmptyState title="Aún no hay pedidos" />
        ) : (
          pedidos.slice(0, 4).map((p) => <PedidoComercioCard key={p.id} pedido={p} destino="admin" />)
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  ventas: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.xs },
  alerta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.tertiaryFixed },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpi: { flexGrow: 1, flexBasis: '45%', minHeight: 100, padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest, gap: 2 },
  celda: { flexGrow: 1, flexBasis: '45%', gap: Spacing.xs, padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest },
});
