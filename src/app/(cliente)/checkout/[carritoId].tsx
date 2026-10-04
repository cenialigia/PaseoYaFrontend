import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PriceText } from '@/components/ui/price-text';
import { Screen, Section } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { getComercio, getProducto, totalLineas, type MetodoPago } from '@/data';
import { formatPrice } from '@/lib/format';
import { problemasDeCarrito, useCart } from '@/state/cart';
import { CheckoutError, mensajeCheckoutError, useOrders } from '@/state/orders';

const METODOS: { id: MetodoPago; titulo: string; detalle: string }[] = [
  {
    id: 'QR_SIMULADO',
    titulo: 'Pagar con QR (simulado)',
    detalle: 'Demostración sin cobro real: verás un QR simulado y podrás pulsar «Simular pago». Tienes 14 días para recoger.',
  },
  {
    id: 'EFECTIVO',
    titulo: 'Pagar en efectivo',
    detalle: 'Pagas en el local al recoger tu pedido. Tienes 72 horas desde la confirmación.',
  },
];

export default function CheckoutScreen() {
  const { carritoId } = useLocalSearchParams<{ carritoId: string }>();
  const { carritos, eliminarCarrito } = useCart();
  const { crearPedido } = useOrders();
  const carrito = carritos.find((c) => c.id === carritoId);
  const comercio = carrito && getComercio(carrito.comercioId);

  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<CheckoutError['motivo'] | null>(null);
  // Segunda barrera además del botón deshabilitado: un doble toque no lanza dos solicitudes.
  const enCurso = useRef(false);

  if (!carrito || !comercio) {
    return <ErrorState title="Carrito no disponible" message="Puede que ya se haya convertido en pedido o que haya vencido." actionLabel="Ir a mi carrito" onAction={() => router.navigate('/carritos')} />;
  }

  const problemas = problemasDeCarrito(carrito);

  const confirmar = async () => {
    if (!metodo || enCurso.current) return;
    enCurso.current = true;
    setProcesando(true);
    setError(null);
    try {
      // Un carrito sólo puede convertirse en un pedido: la clave se deriva de él.
      const pedido = await crearPedido({ carrito, metodo, claveIdempotencia: `chk-${carrito.id}` });
      eliminarCarrito(carrito.id);
      router.replace(
        metodo === 'QR_SIMULADO'
          ? { pathname: '/pago-qr/[pedidoId]', params: { pedidoId: pedido.id } }
          : { pathname: '/reserva-confirmada/[pedidoId]', params: { pedidoId: pedido.id } },
      );
    } catch (e) {
      setError(e instanceof CheckoutError ? e.motivo : 'red');
    } finally {
      enCurso.current = false;
      setProcesando(false);
    }
  };

  return (
    <Screen>
      <View style={styles.store}>
        <AppText variant="titleSm">{comercio.nombre}</AppText>
        <AppText variant="body" color="onSurfaceVariant">
          Recojo en {comercio.piso} · {comercio.local}
        </AppText>
      </View>

      <Section title="Tu pedido">
        {carrito.lineas.map((l) => {
          const p = getProducto(l.productoId);
          return (
            <View key={l.productoId} style={styles.row}>
              <AppText variant="body" style={styles.flex}>
                {l.cantidad} × {p?.nombre}
              </AppText>
              <AppText variant="label">{formatPrice((p?.precio ?? 0) * l.cantidad)}</AppText>
            </View>
          );
        })}
        <View style={[styles.row, styles.total]}>
          <AppText variant="title">Total a pagar</AppText>
          <PriceText amount={totalLineas(carrito.lineas)} variant="title" />
        </View>
      </Section>

      <Section title="Selecciona un método de pago">
        <View accessibilityRole="radiogroup" style={styles.metodos}>
          {METODOS.map((m) => {
            const activo = metodo === m.id;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: activo, disabled: procesando }}
                accessibilityLabel={`${m.titulo}. ${m.detalle}`}
                disabled={procesando}
                onPress={() => setMetodo(m.id)}
                style={[styles.metodo, activo && styles.metodoActivo]}>
                <View style={[styles.radio, activo && styles.radioActivo]} />
                <View style={styles.flex}>
                  <AppText variant="label" color={activo ? 'primary' : 'onSurface'}>
                    {m.titulo}
                  </AppText>
                  <AppText variant="bodySm" color="onSurfaceVariant">
                    {m.detalle}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <View style={styles.retiro}>
        <AppText variant="label" color="onSecondaryFixedVariant">
          Recojo en persona
        </AppText>
        <AppText variant="bodySm" color="onSecondaryFixedVariant">
          Al confirmar se aparta el stock. Cuando tu pedido esté listo recibirás un código de recojo (QR + PIN) para mostrar en el local; es distinto del QR de pago.
        </AppText>
      </View>


      {error ? (
        <View style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <AppText variant="bodySm" color="onErrorContainer">
            {mensajeCheckoutError[error]}
          </AppText>
          {error === 'stock' || error === 'vencido' ? <Button label="Volver a Carritos" variant="outline" onPress={() => router.navigate('/carritos')} /> : null}
        </View>
      ) : null}

      {problemas.length > 0 ? (
        <Button label="Revisa tu carrito antes de pagar" variant="outline" onPress={() => router.navigate('/carritos')} />
      ) : (
        <Button
          label={procesando ? 'Confirmando pedido…' : error === 'red' ? 'Reintentar' : metodo ? 'Continuar' : 'Elige un método de pago'}
          disabled={!metodo}
          loading={procesando}
          onPress={confirmar}
        />
      )}
      <Button label="Modificar mi carrito" variant="ghost" disabled={procesando} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  store: { gap: Spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1, flexShrink: 1 },
  total: { borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: Spacing.sm },
  metodos: { gap: Spacing.sm },
  metodo: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    minHeight: TouchTarget,
    padding: Spacing.md,
    borderRadius: Radius.control,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  metodoActivo: { borderColor: Colors.primary, backgroundColor: Colors.primaryFixed },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.outline, marginTop: 2 },
  radioActivo: { borderColor: Colors.primary, borderWidth: 7 },
  retiro: { backgroundColor: Colors.secondaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.xs },
  error: { backgroundColor: Colors.errorContainer, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.sm },
});
