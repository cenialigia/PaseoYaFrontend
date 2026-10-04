import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Visual } from '@/components/producto-visual';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip, StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { ESTADOS_EN_CURSO, estadoPedidoUI, etiquetaPago, getComercio, getProducto, type Pedido } from '@/data';
import { formatFechaHora, normalizeSearch } from '@/lib/format';
import { useOrders } from '@/state/orders';

type Vista = 'reservas' | 'compras' | 'historial';

// DEC-F14-10: tres pestañas sobre la misma lista de pedidos.
const filtros: Record<Vista, (p: Pedido) => boolean> = {
  reservas: (p) => ESTADOS_EN_CURSO.includes(p.estado) && p.pago.metodo === 'EFECTIVO',
  compras: (p) => ESTADOS_EN_CURSO.includes(p.estado) && p.pago.metodo === 'QR_SIMULADO',
  historial: (p) => !ESTADOS_EN_CURSO.includes(p.estado),
};

const vacios: Record<Vista, string> = {
  reservas: 'No tienes reservas en curso',
  compras: 'No tienes compras en curso',
  historial: 'Aún no tienes pedidos terminados',
};

// CLI-18–22 · Mis pedidos: Reservas (efectivo), Compras (QR) e Historial (entregados, cancelados y vencidos).
export default function Pedidos() {
  const [vista, setVista] = useState<Vista>('compras');
  const [consulta, setConsulta] = useState('');
  const { pedidos } = useOrders();
  const termino = normalizeSearch(consulta);
  const conteo = (v: Vista) => pedidos.filter(filtros[v]).length;
  const lista = pedidos
    .filter(filtros[vista])
    .filter(
      (p) =>
        !termino ||
        normalizeSearch(getComercio(p.comercioId)?.nombre ?? '').includes(termino) ||
        p.lineas.some((l) => normalizeSearch(getProducto(l.productoId)?.nombre ?? '').includes(termino)),
    );

  return (
    <Screen title="Mis pedidos">
      <View style={styles.tabs} accessibilityRole="tablist">
        <FilterChip label={`Compras (${conteo('compras')})`} selected={vista === 'compras'} onPress={() => setVista('compras')} />
        <FilterChip label={`Reservas (${conteo('reservas')})`} selected={vista === 'reservas'} onPress={() => setVista('reservas')} />
        <FilterChip label={`Historial (${conteo('historial')})`} selected={vista === 'historial'} onPress={() => setVista('historial')} />
      </View>
      {vista === 'historial' ? <SearchField value={consulta} onChangeText={setConsulta} placeholder="Buscar por tienda o producto" /> : null}
      {lista.length === 0 ? (
        <EmptyState title={termino ? 'Sin resultados' : vacios[vista]} message={termino ? undefined : 'Tus pedidos aparecerán aquí.'} />
      ) : (
        lista.map((p) => {
          const c = getComercio(p.comercioId);
          const estado = estadoPedidoUI[p.estado];
          const primera = getProducto(p.lineas[0]?.productoId ?? '');
          return (
            <Card key={p.id} accessibilityLabel={`Pedido ${p.codigo} de ${c?.nombre}, ${estado.etiqueta}`}>
              <View style={styles.row}>
                <Visual url={c?.imagenUrl} icono="storefront" alto={44} estilo={styles.logo} />
                <View style={styles.flex}>
                  <AppText variant="titleSm">{c?.nombre}</AppText>
                  <AppText variant="caption" color="onSurfaceVariant">
                    {p.pago.metodo === 'EFECTIVO' ? 'Reserva' : 'Compra'} {p.codigo} · {formatFechaHora(p.confirmadoEn)}
                  </AppText>
                </View>
                <StatusChip label={estado.etiqueta} tone={estado.tono} />
              </View>
              {primera ? (
                <AppText variant="bodySm" color="onSurfaceVariant">
                  {primera.nombre}
                  {p.lineas.length > 1 ? ` y ${p.lineas.length - 1} más` : ''}
                </AppText>
              ) : null}
              <View style={styles.row}>
                <PriceText amount={p.total} />
                <AppText variant="labelSm" color="onSurfaceVariant">
                  {etiquetaPago(p)}
                </AppText>
              </View>
              <View style={styles.acciones}>
                <Button label="Ver detalles" variant="outline" accessibilityLabel={`Ver detalles del pedido ${p.codigo}`} onPress={() => router.push({ pathname: '/pedido/[pedidoId]/detalle', params: { pedidoId: p.id } })} />
                {ESTADOS_EN_CURSO.includes(p.estado) ? (
                  <Button label="Ver ticket" variant="ghost" accessibilityLabel={`Ver ticket del pedido ${p.codigo}`} onPress={() => router.push({ pathname: '/pedido/[pedidoId]/ticket', params: { pedidoId: p.id } })} />
                ) : null}
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  logo: { width: 44 },
  flex: { flex: 1, minWidth: 140, gap: 2 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
