import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { nombreLinea } from '@/components/pedido-comercio-card';
import { LineaEstado } from '@/components/linea-estado';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip, StatusChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ESTADOS_EN_CURSO, estadoPedidoUI, etiquetaPago } from '@/data';
import { useEventosPedido } from '@/data/eventos';
import { formatFechaHora, formatPrice } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useOrders } from '@/state/orders';

type Contacto = { nombre: string; telefono: string | null };

const MOTIVOS = ['Sin stock', 'Tienda cerrada', 'No podemos prepararlo a tiempo'];

const siguiente = {
  CONFIRMED: { boton: 'Empezar preparación', titulo: '¿Empezar a preparar el pedido?', texto: 'El cliente verá que su pedido está en preparación y ya no podrá cancelarlo.' },
  IN_PREPARATION: { boton: 'Marcar como listo', titulo: '¿El pedido está listo?', texto: 'El cliente recibirá su código de recojo (QR + PIN) para retirarlo.' },
} as const;

// COM-03/04 · Detalle del pedido: productos, pago separado del retiro y transiciones confirmadas (DEC-16, DEC-F14-14).
export default function OrdenComercio() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { pedidos, avanzar, rechazar } = useOrders();
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const eventos = useEventosPedido(pedidoId, `${pedido?.estado}-${pedido?.pago.estado}`);
  const [contacto, setContacto] = useState<Contacto | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const enCurso = !!pedido && ESTADOS_EN_CURSO.includes(pedido.estado);

  // DEC-F14-08: nombre y teléfono del cliente sólo mientras el pedido está activo.
  useEffect(() => {
    if (!enCurso) return;
    let activo = true;
    supabase.rpc('contacto_cliente', { p_pedido: pedidoId }).then(({ data }) => {
      if (activo) setContacto(((data as Contacto[] | null) ?? [])[0] ?? null);
    });
    return () => {
      activo = false;
    };
  }, [pedidoId, enCurso]);

  if (!pedido) return <ErrorState title="Pedido no encontrado" actionLabel="Volver a pedidos" onAction={() => router.navigate('/ordenes')} />;

  const estado = estadoPedidoUI[pedido.estado];
  const paso = pedido.estado === 'CONFIRMED' || pedido.estado === 'IN_PREPARATION' ? siguiente[pedido.estado] : null;
  const efectivoPendiente = pedido.pago.metodo === 'EFECTIVO' && pedido.pago.estado === 'PENDING';

  const confirmarPaso = () => {
    if (!paso) return;
    Alert.alert(paso.titulo, paso.texto, [
      { text: 'Volver', style: 'cancel' },
      {
        text: paso.boton,
        onPress: async () => {
          setOcupado(true);
          const ok = await avanzar(pedido.id);
          setOcupado(false);
          setError(!ok);
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.cabecera}>
        <View style={styles.flex}>
          <AppText variant="headline">{pedido.codigo}</AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {pedido.pago.metodo === 'EFECTIVO' ? 'Reserva' : 'Compra'} · {formatFechaHora(pedido.confirmadoEn)}
          </AppText>
        </View>
        <StatusChip label={estado.etiqueta} tone={estado.tono} />
      </View>

      {enCurso && contacto ? (
        <Card accessibilityLabel={`Cliente ${contacto.nombre}${contacto.telefono ? `, teléfono ${contacto.telefono}` : ''}`}>
          <AppText variant="label">Cliente</AppText>
          <AppText variant="body">{contacto.nombre}</AppText>
          {contacto.telefono ? (
            <AppText variant="bodySm" color="onSurfaceVariant">
              {contacto.telefono}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      <Section title="Productos">
        {pedido.lineas.map((l) => (
          <View key={l.productoId} style={styles.linea}>
            <AppText variant="body" style={styles.flex}>
              {l.cantidad} × {nombreLinea(l)}
            </AppText>
            <AppText variant="body">{formatPrice((l.precioUnitario ?? 0) * l.cantidad)}</AppText>
          </View>
        ))}
        <View style={[styles.linea, styles.total]}>
          <AppText variant="titleSm">Total</AppText>
          <AppText variant="titleSm" color="primary">
            {formatPrice(pedido.total)}
          </AppText>
        </View>
      </Section>

      <LineaEstado estado={pedido.estado} eventos={eventos} />

      <View style={styles.pago} accessible>
        <AppText variant="label">Pago</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {etiquetaPago(pedido)}
        </AppText>
        {enCurso ? (
          <AppText variant="caption" color="onSurfaceVariant">
            Recoger antes del {formatFechaHora(pedido.venceEn)}
          </AppText>
        ) : null}
      </View>

      {paso ? <Button label={paso.boton} loading={ocupado} onPress={confirmarPaso} /> : null}
      {paso && !rechazando ? <Button label="Rechazar pedido" variant="ghost" disabled={ocupado} onPress={() => setRechazando(true)} /> : null}
      {paso && rechazando ? (
        <Card>
          <AppText variant="label">¿Por qué rechazas el pedido?</AppText>
          <View style={styles.motivos}>
            {MOTIVOS.map((m) => (
              <FilterChip key={m} label={m} selected={motivo === m} onPress={() => setMotivo(m)} />
            ))}
          </View>
          <TextField label="Motivo" value={motivo} onChangeText={setMotivo} maxLength={200} ayuda="El cliente lo verá en su aviso." />
          <Button
            label="Rechazar y avisar al cliente"
            variant="destructive"
            disabled={motivo.trim().length < 3}
            loading={ocupado}
            onPress={() =>
              Alert.alert('¿Rechazar el pedido?', 'Se cancelará, el stock volverá a tu catálogo y, si pagó con QR, se reembolsará.', [
                { text: 'Volver', style: 'cancel' },
                {
                  text: 'Rechazar',
                  style: 'destructive',
                  onPress: async () => {
                    setOcupado(true);
                    const ok = await rechazar(pedido.id, motivo);
                    setOcupado(false);
                    setError(!ok);
                    if (ok) setRechazando(false);
                  },
                },
              ])
            }
          />
          <Button label="Volver" variant="ghost" disabled={ocupado} onPress={() => setRechazando(false)} />
        </Card>
      ) : null}
      {pedido.motivoCancelacion ? (
        <AppText variant="bodySm" color="error">Rechazado: {pedido.motivoCancelacion}</AppText>
      ) : null}
      {pedido.estado === 'READY_FOR_PICKUP' ? (
        <>
          {efectivoPendiente ? (
            <AppText variant="bodySm" color="onTertiaryFixedVariant">
              Cobra {formatPrice(pedido.total)} en efectivo al entregar; lo confirmarás después de verificar el código.
            </AppText>
          ) : null}
          <Button label="Gestionar retiro" onPress={() => router.push({ pathname: '/retiro', params: { pedidoId: pedido.id } })} />
        </>
      ) : null}
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudo actualizar el pedido. Revisa su estado e intenta de nuevo.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  flex: { flex: 1 },
  linea: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'baseline' },
  total: { borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.sm },
  motivos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pago: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.control, padding: Spacing.md, gap: 2 },
});
