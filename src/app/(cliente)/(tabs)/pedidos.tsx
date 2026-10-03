import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip, StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { ESTADOS_EN_CURSO, estadoPedidoUI, etiquetaPago, getComercio } from '@/data';
import { useOrders } from '@/state/orders';

export default function Pedidos() {
  const [vista, setVista] = useState<'curso' | 'historial'>('curso');
  const { pedidos } = useOrders();
  const enCurso = pedidos.filter((p) => ESTADOS_EN_CURSO.includes(p.estado));
  const historial = pedidos.filter((p) => !ESTADOS_EN_CURSO.includes(p.estado));
  const lista = vista === 'curso' ? enCurso : historial;

  return (
    <Screen title="Pedidos">
      <View style={styles.tabs}>
        <FilterChip label={`En curso (${enCurso.length})`} selected={vista === 'curso'} onPress={() => setVista('curso')} />
        <FilterChip label={`Historial (${historial.length})`} selected={vista === 'historial'} onPress={() => setVista('historial')} />
      </View>
      {lista.length === 0 ? (
        <EmptyState title={vista === 'curso' ? 'No tiene pedidos en curso' : 'Aún no tiene historial'} />
      ) : (
        lista.map((p) => {
          const c = getComercio(p.comercioId);
          const estado = estadoPedidoUI[p.estado];
          return (
            <Card key={p.id} accessibilityLabel={`Pedido ${p.codigo} de ${c?.nombre}, ${estado.etiqueta}`}>
              <View style={styles.row}>
                <AppText variant="titleSm">{c?.nombre}</AppText>
                <StatusChip label={estado.etiqueta} tone={estado.tono} />
              </View>
              <AppText variant="bodySm" color="onSurfaceVariant">
                {p.codigo} · {c?.local} · {c?.piso}
              </AppText>
              <PriceText amount={p.total} />
              <AppText variant="labelSm" color="onSurfaceVariant">
                {etiquetaPago(p)}
              </AppText>
              <Button label="Ver detalle" variant="ghost" accessibilityLabel={`Ver detalle del pedido ${p.codigo}`} onPress={() => router.push({ pathname: '/pedido/[pedidoId]/detalle', params: { pedidoId: p.id } })} />
              {p.estado === 'READY_FOR_PICKUP' ? (
                <Button label="Ver código de retiro" onPress={() => router.push({ pathname: '/pedido/[pedidoId]/ticket', params: { pedidoId: p.id } })} />
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
});
