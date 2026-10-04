import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Spacing } from '@/constants/theme';
import { estadoPedidoUI, type EstadoPedido } from '@/data';
import type { EventoPedido } from '@/data/eventos';
import { formatFechaHora } from '@/lib/format';

const PASOS: { estado: EstadoPedido; texto: string }[] = [
  { estado: 'CONFIRMED', texto: 'Pedido recibido' },
  { estado: 'IN_PREPARATION', texto: 'En preparación' },
  { estado: 'READY_FOR_PICKUP', texto: 'Listo para retiro' },
  { estado: 'DELIVERED', texto: 'Entregado' },
];

// Línea de estado del pedido (PDF COM-04 / ADM-07) con la hora de cada paso según el historial (RNF-06).
export function LineaEstado({ estado, eventos = [] }: { estado: EstadoPedido; eventos?: EventoPedido[] }) {
  const horaDe = (e: EstadoPedido) => {
    const ev = eventos.find((x) => x.estado === e);
    return ev ? formatFechaHora(ev.creadoEn) : undefined;
  };

  if (estado === 'CANCELLED' || estado === 'EXPIRED') {
    const hora = horaDe(estado);
    return (
      <View style={styles.fila} accessible accessibilityLabel={`Estado del pedido: ${estadoPedidoUI[estado].etiqueta}${hora ? `, ${hora}` : ''}`}>
        <MaterialIcons name="cancel" size={22} color={Colors.error} />
        <AppText variant="label" color="error" style={styles.flex}>
          {estadoPedidoUI[estado].etiqueta}
        </AppText>
        {hora ? (
          <AppText variant="caption" color="onSurfaceVariant">
            {hora}
          </AppText>
        ) : null}
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
        const hora = hecho || esActual ? horaDe(p.estado) : undefined;
        return (
          <View key={p.estado} style={styles.fila}>
            <MaterialIcons
              name={hecho ? 'check-circle' : esActual ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={22}
              color={hecho ? Colors.secondary : esActual ? Colors.primary : Colors.outlineVariant}
            />
            <AppText variant={esActual ? 'label' : 'bodySm'} color={hecho || esActual ? 'onSurface' : 'onSurfaceVariant'} style={styles.flex}>
              {p.texto}
            </AppText>
            {hora ? (
              <AppText variant="caption" color="onSurfaceVariant">
                {hora}
              </AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const ETIQUETA_PAGO: Record<string, string> = { PENDING: 'pago pendiente', PAID: 'pagado', REFUNDED: 'reembolsado', RETAINED: 'retenido por el comercio' };

// Historial completo para el admin: cada cambio de estado o de pago, con fecha y autor.
export function HistorialPedido({ eventos }: { eventos: EventoPedido[] }) {
  if (eventos.length === 0) return null;
  return (
    <View style={styles.contenedor}>
      <AppText variant="label">Historial</AppText>
      {eventos.map((e) => (
        <View key={e.id} style={styles.evento} accessible accessibilityLabel={`${formatFechaHora(e.creadoEn)}: ${estadoPedidoUI[e.estado].etiqueta}, ${ETIQUETA_PAGO[e.estadoPago]}, por ${e.actor ?? 'usuario'}`}>
          <AppText variant="caption" color="onSurfaceVariant">
            {formatFechaHora(e.creadoEn)}
          </AppText>
          <AppText variant="bodySm">
            {estadoPedidoUI[e.estado].etiqueta} · {ETIQUETA_PAGO[e.estadoPago]}
          </AppText>
          <AppText variant="caption" color="onSurfaceVariant">
            {e.actor ?? 'Usuario'}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: Spacing.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  evento: { gap: 2, paddingLeft: Spacing.sm, borderLeftWidth: 2, borderLeftColor: Colors.outlineVariant },
});
