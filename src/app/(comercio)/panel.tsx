import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip, StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { estadoPedidoUI, etiquetaPago, getComercio, getProducto, type Pedido } from '@/data';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/state/auth';
import { mensajeValidacion, useOrders } from '@/state/orders';

type Vista = 'atender' | 'listos' | 'historial';

export default function PanelComercio() {
  const { usuario, salir } = useAuth();
  const { pedidos } = useOrders();
  const [vista, setVista] = useState<Vista>('atender');
  // La tarjeta entregada cambia de lista y se desmonta: la confirmación vive en el panel.
  const [entregado, setEntregado] = useState<string | null>(null);
  const comercioId = usuario?.comercioId ?? '';
  const comercio = getComercio(comercioId);
  const propios = pedidos.filter((p) => p.comercioId === comercioId);
  const grupos: Record<Vista, Pedido[]> = {
    atender: propios.filter((p) => p.estado === 'CONFIRMED' || p.estado === 'IN_PREPARATION'),
    listos: propios.filter((p) => p.estado === 'READY_FOR_PICKUP'),
    historial: propios.filter((p) => p.estado === 'DELIVERED' || p.estado === 'CANCELLED' || p.estado === 'EXPIRED'),
  };
  const entregados = propios.filter((p) => p.estado === 'DELIVERED');
  const ventas = entregados.reduce((sum, p) => sum + p.total, 0);

  return (
    <Screen>
      <Stack.Screen options={{ title: comercio?.nombre ?? 'Mi comercio', headerRight: () => <Button label="Salir" variant="ghost" onPress={() => void salir()} /> }} />
      <AppText variant="bodySm" color="onSurfaceVariant">
        Panel de comercio · {comercio?.local} · {comercio?.piso}
      </AppText>
      <Button label="Gestionar mi catálogo" variant="outline" onPress={() => router.push('/catalogo')} />
      <View style={styles.ventas} accessible accessibilityLabel={`Ventas entregadas: ${formatPrice(ventas)} en ${entregados.length} pedidos`}>
        <AppText variant="label" color="onPrimaryFixedVariant">
          Ventas entregadas
        </AppText>
        <AppText variant="title" color="primary">
          {formatPrice(ventas)}
        </AppText>
        <AppText variant="caption" color="onPrimaryFixedVariant">
          {entregados.length} {entregados.length === 1 ? 'pedido' : 'pedidos'}
        </AppText>
      </View>
      {entregado ? (
        <View style={styles.exito} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <AppText variant="label" color="onSecondaryFixedVariant">
            Retiro validado: {entregado} quedó como entregado.
          </AppText>
        </View>
      ) : null}
      <View style={styles.chips}>
        <FilterChip label={`Por atender (${grupos.atender.length})`} selected={vista === 'atender'} onPress={() => setVista('atender')} />
        <FilterChip label={`Listos (${grupos.listos.length})`} selected={vista === 'listos'} onPress={() => setVista('listos')} />
        <FilterChip label={`Historial (${grupos.historial.length})`} selected={vista === 'historial'} onPress={() => setVista('historial')} />
      </View>
      {grupos[vista].length === 0 ? (
        <EmptyState title="Sin pedidos en esta lista" />
      ) : (
        grupos[vista].map((p) => <PedidoComercio key={p.id} pedido={p} onEntregado={setEntregado} />)
      )}
    </Screen>
  );
}

function PedidoComercio({ pedido, onEntregado }: { pedido: Pedido; onEntregado: (codigo: string) => void }) {
  const { avanzar, confirmarEfectivo, validarRetiro } = useOrders();
  const [ocupado, setOcupado] = useState(false);
  const [pin, setPin] = useState('');
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);
  const estado = estadoPedidoUI[pedido.estado];
  const efectivoPendiente = pedido.pago.metodo === 'EFECTIVO' && pedido.pago.estado === 'PENDING';

  const accion = async (fn: () => Promise<boolean>) => {
    setOcupado(true);
    const ok = await fn();
    setOcupado(false);
    if (!ok) setResultado({ ok: false, texto: 'No se pudo completar la acción. Actualice e intente de nuevo.' });
  };

  const validar = async () => {
    setOcupado(true);
    const r = await validarRetiro(pedido.id, pin);
    setOcupado(false);
    if (r === 'ok') onEntregado(pedido.codigo);
    else setResultado({ ok: false, texto: mensajeValidacion[r] });
  };

  return (
    <Card accessibilityLabel={`Pedido ${pedido.codigo}, ${estado.etiqueta}`}>
      <View style={styles.row}>
        <AppText variant="titleSm">{pedido.codigo}</AppText>
        <StatusChip label={estado.etiqueta} tone={estado.tono} />
      </View>
      {pedido.lineas.map((l) => (
        <AppText key={l.productoId} variant="bodySm" color="onSurfaceVariant">
          {l.cantidad} × {getProducto(l.productoId)?.nombre}
        </AppText>
      ))}
      <PriceText amount={pedido.total} />
      <AppText variant="labelSm" color="onSurfaceVariant">
        {etiquetaPago(pedido)}
      </AppText>

      {pedido.estado === 'CONFIRMED' ? <Button label="Iniciar preparación" loading={ocupado} onPress={() => accion(() => avanzar(pedido.id))} /> : null}
      {pedido.estado === 'IN_PREPARATION' ? <Button label="Marcar listo para retiro" loading={ocupado} onPress={() => accion(() => avanzar(pedido.id))} /> : null}
      {pedido.estado === 'READY_FOR_PICKUP' ? (
        <View style={styles.validar}>
          {efectivoPendiente ? (
            <Button label="Confirmar pago en efectivo" variant="secondary" loading={ocupado} onPress={() => accion(() => confirmarEfectivo(pedido.id))} />
          ) : null}
          <TextField label="PIN del cliente" value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={6} />
          <Button label="Validar retiro" disabled={pin.length !== 6} loading={ocupado} onPress={validar} />
        </View>
      ) : null}
      {resultado ? (
        <AppText variant="bodySm" color={resultado.ok ? 'onSecondaryFixedVariant' : 'error'} accessibilityRole="alert">
          {resultado.texto}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  ventas: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.xs },
  validar: { gap: Spacing.sm, paddingTop: Spacing.sm },
  exito: { backgroundColor: Colors.secondaryFixed, borderRadius: Radius.control, padding: Spacing.md },
});
