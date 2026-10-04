import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ComercioHeader } from '@/components/comercio-header';
import { PedidoComercioCard } from '@/components/pedido-comercio-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen, Section } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { esVenta, useCatalogo } from '@/data';
import { cambiarAbierto } from '@/data/catalogo-comercio';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/state/auth';
import { useOrders } from '@/state/orders';

const inicioDelDia = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// COM-01 · Inicio del comercio: estado de la tienda, pedidos por atender y ventas del día con datos reales.
export default function PanelComercio() {
  const { usuario } = useAuth();
  const { recargar, comercios } = useCatalogo();
  const { pedidos } = useOrders();
  const comercioId = usuario?.comercioId ?? '';
  // Del estado del contexto, no de getComercio: el React Compiler memoriza llamadas a la caché del módulo.
  const comercio = comercios.find((c) => c.id === comercioId);
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState(false);

  const propios = pedidos.filter((p) => p.comercioId === comercioId);
  const nuevos = propios.filter((p) => p.estado === 'CONFIRMED');
  const preparando = propios.filter((p) => p.estado === 'IN_PREPARATION');
  const listos = propios.filter((p) => p.estado === 'READY_FOR_PICKUP');
  const porCobrar = listos.filter((p) => p.pago.metodo === 'EFECTIVO' && p.pago.estado === 'PENDING');
  const hoy = propios.filter((p) => esVenta(p) && p.confirmadoEn >= inicioDelDia());
  const ventasHoy = hoy.reduce((s, p) => s + p.total, 0);
  const activos = [...nuevos, ...preparando, ...listos].slice(0, 3);

  const alternarAbierto = async (abierto: boolean) => {
    setCambiando(true);
    const ok = await cambiarAbierto(comercioId, abierto);
    if (ok) await recargar();
    setCambiando(false);
    setError(!ok);
  };

  const indicador = (titulo: string, valor: number, icono: keyof typeof MaterialIcons.glyphMap) => (
    <Pressable
      key={titulo}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}: ${valor}. Ver pedidos`}
      onPress={() => router.push('/ordenes')}
      style={styles.indicador}>
      <MaterialIcons name={icono} size={24} color={Colors.primary} />
      <AppText variant="headline" color="primary">
        {valor}
      </AppText>
      <AppText variant="labelSm" color="onSurfaceVariant">
        {titulo}
      </AppText>
    </Pressable>
  );

  return (
    <Screen header={<ComercioHeader title="Inicio" />}>
      <View style={styles.estado}>
        <View style={styles.flex}>
          <AppText variant="label">{comercio?.abierto ? 'Tienda abierta' : 'Tienda cerrada'}</AppText>
          <AppText variant="caption" color="onSurfaceVariant">
            {comercio?.abierto ? 'Los clientes pueden comprar y reservar.' : 'Los clientes ven tu tienda, pero no pueden pedir.'}
          </AppText>
        </View>
        <Switch
          value={!!comercio?.abierto}
          disabled={cambiando}
          onValueChange={alternarAbierto}
          accessibilityLabel="Tienda abierta"
          trackColor={{ true: Colors.secondary, false: Colors.outlineVariant }}
          thumbColor={Colors.surfaceContainerLowest}
        />
      </View>
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudo cambiar el estado de la tienda. Intenta de nuevo.
        </AppText>
      ) : null}

      <View style={styles.ventas} accessible accessibilityLabel={`Ventas de hoy: ${formatPrice(ventasHoy)} en ${hoy.length} ${hoy.length === 1 ? 'pedido pagado' : 'pedidos pagados'}`}>
        <AppText variant="label" color="onPrimaryFixedVariant">
          Ventas de hoy
        </AppText>
        <AppText variant="headline" color="primary">
          {formatPrice(ventasHoy)}
        </AppText>
        <AppText variant="caption" color="onPrimaryFixedVariant">
          {hoy.length} {hoy.length === 1 ? 'pedido pagado' : 'pedidos pagados'}
        </AppText>
      </View>

      <View style={styles.indicadores}>
        {indicador('Nuevos', nuevos.length, 'fiber-new')}
        {indicador('En preparación', preparando.length, 'pending-actions')}
        {indicador('Listos', listos.length, 'inventory')}
        {indicador('Efectivo por cobrar', porCobrar.length, 'payments')}
      </View>

      <View style={styles.accesos}>
        <Button label="Escanear retiro" onPress={() => router.push('/retiro')} />
        <Button label="Nuevo producto" variant="outline" onPress={() => router.push({ pathname: '/editar-producto/[productoId]', params: { productoId: 'nuevo' } })} />
        <Button label="Mis promociones" variant="outline" onPress={() => router.push('/promociones-comercio')} />
      </View>

      <Section title="Pedidos en curso">
        {activos.length === 0 ? (
          <EmptyState title="Sin pedidos en curso" message="Cuando un cliente compre o reserve, aparecerá aquí al instante." />
        ) : (
          activos.map((p) => <PedidoComercioCard key={p.id} pedido={p} />)
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  estado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest },
  flex: { flex: 1, gap: 2 },
  ventas: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.xs },
  indicadores: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  indicador: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 104,
    padding: Spacing.md,
    borderRadius: Radius.control,
    backgroundColor: Colors.surfaceContainerLowest,
    gap: 2,
  },
  accesos: { gap: Spacing.sm },
});
