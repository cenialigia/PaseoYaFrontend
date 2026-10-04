import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Spacing } from '@/constants/theme';
import { estadoPedidoUI, type EstadoPedido } from '@/data';

const PASOS: { estado: EstadoPedido; texto: string }[] = [
  { estado: 'CONFIRMED', texto: 'Pedido recibido' },
  { estado: 'IN_PREPARATION', texto: 'En preparación' },
  { estado: 'READY_FOR_PICKUP', texto: 'Listo para retiro' },
  { estado: 'DELIVERED', texto: 'Entregado' },
];

// Línea de estado del pedido (PDF COM-04 / ADM-07): pasos hechos, actual y pendientes. Cancelado y vencido se muestran aparte.
export function LineaEstado({ estado }: { estado: EstadoPedido }) {
  if (estado === 'CANCELLED' || estado === 'EXPIRED') {
    return (
      <View style={styles.fila} accessible accessibilityLabel={`Estado del pedido: ${estadoPedidoUI[estado].etiqueta}`}>
        <MaterialIcons name="cancel" size={22} color={Colors.error} />
        <AppText variant="label" color="error">
          {estadoPedidoUI[estado].etiqueta}
        </AppText>
      </View>
    );
  }
  const actual = PASOS.findIndex((p) => p.estado === estado);
  return (
    <View style={styles.contenedor} accessible accessibilityLabel={`Estado del pedido: paso ${actual + 1} de ${PASOS.length}, ${PASOS[actual].texto}`}>
      <AppText variant="label">Estado del pedido</AppText>
      {PASOS.map((p, i) => {
        const hecho = i < actual || estado === 'DELIVERED';
        const esActual = i === actual && estado !== 'DELIVERED';
        return (
          <View key={p.estado} style={styles.fila}>
            <MaterialIcons
              name={hecho ? 'check-circle' : esActual ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={22}
              color={hecho ? Colors.secondary : esActual ? Colors.primary : Colors.outlineVariant}
            />
            <AppText variant={esActual ? 'label' : 'bodySm'} color={hecho || esActual ? 'onSurface' : 'onSurfaceVariant'}>
              {p.texto}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: Spacing.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
