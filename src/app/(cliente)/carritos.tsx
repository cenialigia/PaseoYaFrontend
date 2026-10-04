import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { Screen, Section } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getComercio, getProducto, totalLineas, type Carrito } from '@/data';
import { useNow } from '@/hooks/use-now';
import { formatPrice, formatRemaining } from '@/lib/format';
import { problemasDeCarrito, useCart } from '@/state/cart';

const AVISO_MS = 5 * 60 * 1000;

export default function Carritos() {
  // Cada segundo para que el temporizador sea visible en vivo; el lector sólo anuncia los minutos.
  const ahora = useNow(1000);
  const { carritos } = useCart();
  const activos = carritos.filter((c) => c.expiraEn > ahora);
  const vencidos = carritos.filter((c) => c.expiraEn <= ahora);

  return (
    <Screen>
      <View style={styles.flow}>
        <AppText variant="label" color="onPrimaryFixedVariant">
          Cómo funciona
        </AppText>
        <AppText variant="bodySm" color="onPrimaryFixedVariant">
          1. Cada comercio tiene su propio carrito y se paga por separado.{'\n'}2. Cuando esté listo, recibes tu código de recojo.{'\n'}3. Recoges tu pedido en persona en el local.
        </AppText>
      </View>

      {activos.length === 0 ? (
        <EmptyState
          title="Tu carrito está vacío"
          message="Agrega productos desde Inicio o Buscar."
          actionLabel="Ir a Inicio"
          onAction={() => router.navigate('/inicio')}
        />
      ) : (
        activos.map((c) => <CarritoActivo key={c.id} carrito={c} ahora={ahora} />)
      )}

      {vencidos.length > 0 ? (
        <Section title="Vencidos">
          {vencidos.map((c) => (
            <CarritoVencido key={c.id} carrito={c} />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}

function CarritoActivo({ carrito, ahora }: { carrito: Carrito; ahora: number }) {
  const { cambiarCantidad, eliminarCarrito } = useCart();
  const comercio = getComercio(carrito.comercioId);
  const restante = carrito.expiraEn - ahora;
  const porVencer = restante <= AVISO_MS;
  const problemas = problemasDeCarrito(carrito);
  const unidades = carrito.lineas.reduce((n, l) => n + l.cantidad, 0);
  const minutos = Math.ceil(restante / 60000);

  const confirmarEliminar = () =>
    Alert.alert('Eliminar carrito', `Se quitarán todos los productos del carrito de ${comercio?.nombre}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarCarrito(carrito.id) },
    ]);

  return (
    <Card accessibilityLabel={`Carrito de ${comercio?.nombre}`}>
      <View style={styles.row}>
        <AppText variant="titleSm">{comercio?.nombre}</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {unidades} {unidades === 1 ? 'artículo' : 'artículos'}
        </AppText>
      </View>
      <AppText variant="bodySm" color="onSurfaceVariant">
        Retiro en {comercio?.local} · {comercio?.piso}
      </AppText>

      <View
        style={[styles.timer, porVencer && styles.timerUrgente]}
        accessible
        accessibilityLabel={`El carrito vence en ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`}>
        <AppText variant="label" color={porVencer ? 'onErrorContainer' : 'onTertiaryFixedVariant'}>
          {porVencer ? '¡Últimos minutos! ' : ''}Vence en {formatRemaining(restante)}
        </AppText>
      </View>

      {carrito.lineas.map((l) => {
        const p = getProducto(l.productoId);
        if (!p) return null;
        const problema = problemas.find((x) => x.productoId === l.productoId);
        return (
          <View key={l.productoId} style={styles.linea}>
            <View style={styles.row}>
              <AppText variant="body" style={styles.nombre}>
                {p.nombre}
              </AppText>
              <AppText variant="label">{formatPrice(p.precio * l.cantidad)}</AppText>
            </View>
            {problema ? (
              <View style={styles.problema} accessibilityRole="alert">
                <AppText variant="bodySm" color="onErrorContainer">
                  {problema.tipo === 'agotado'
                    ? 'Este producto se agotó. Quítalo para continuar.'
                    : `Ahora sólo quedan ${problema.disponible}. Ajusta la cantidad para continuar.`}
                </AppText>
                {problema.tipo === 'menos-stock' ? (
                  <Button label={`Dejar ${problema.disponible}`} variant="outline" onPress={() => cambiarCantidad(carrito.id, p.id, problema.disponible)} />
                ) : null}
              </View>
            ) : null}
            <View style={styles.acciones}>
              {p.stock > 0 ? (
                <QuantityStepper
                  label={`Cantidad de ${p.nombre}`}
                  value={l.cantidad}
                  max={Math.max(p.stock, l.cantidad)}
                  onChange={(n) => cambiarCantidad(carrito.id, p.id, n)}
                />
              ) : null}
              <Button label="Quitar" variant="ghost" accessibilityLabel={`Quitar ${p.nombre}`} onPress={() => cambiarCantidad(carrito.id, p.id, 0)} />
            </View>
          </View>
        );
      })}

      <View style={styles.row}>
        <AppText variant="label">Subtotal</AppText>
        <PriceText amount={totalLineas(carrito.lineas)} />
      </View>
      {/* DEC-05: el carrito no aparta inventario; no se afirma reserva. */}
      <AppText variant="caption" color="onSurfaceVariant">
        La disponibilidad se confirma al pagar.
      </AppText>
      <Button
        label={problemas.length > 0 ? 'Revisa los productos marcados' : 'Continuar'}
        accessibilityLabel={`Continuar al pago en ${comercio?.nombre}`}
        disabled={problemas.length > 0}
        onPress={() => router.push({ pathname: '/checkout/[carritoId]', params: { carritoId: carrito.id } })}
      />
      <Button label="Eliminar carrito" variant="ghost" onPress={confirmarEliminar} />
    </Card>
  );
}

function CarritoVencido({ carrito }: { carrito: Carrito }) {
  const { recuperar, eliminarCarrito } = useCart();
  const comercio = getComercio(carrito.comercioId);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const onRecuperar = () => {
    const r = recuperar(carrito.id);
    if (r.cerrado) setMensaje('El comercio está cerrado; no se puede recuperar ahora.');
    else if (r.recuperadas === 0) setMensaje('Ningún producto sigue disponible.');
  };

  return (
    <Card accessibilityLabel={`Carrito vencido de ${comercio?.nombre}`}>
      <View style={styles.row}>
        <AppText variant="titleSm">{comercio?.nombre}</AppText>
        <StatusChip label="Vencido" tone="cerrado" />
      </View>
      <AppText variant="bodySm" color="onSurfaceVariant">
        {carrito.lineas.map((l) => `${l.cantidad} × ${getProducto(l.productoId)?.nombre}`).join(' · ')}
      </AppText>
      <AppText variant="caption" color="onSurfaceVariant">
        Al volver a agregarlo se recuperan sólo los productos con stock.
      </AppText>
      <Button label="Volver a agregar" variant="outline" onPress={onRecuperar} />
      <Button label="Descartar" variant="ghost" onPress={() => eliminarCarrito(carrito.id)} />
      {mensaje ? (
        <AppText variant="bodySm" color="error" accessibilityLiveRegion="polite">
          {mensaje}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flow: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md, gap: Spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  nombre: { flexShrink: 1 },
  timer: { backgroundColor: Colors.tertiaryFixed, borderRadius: Radius.control, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  timerUrgente: { backgroundColor: Colors.errorContainer },
  linea: { gap: Spacing.sm, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.surfaceContainerHigh },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  problema: { backgroundColor: Colors.errorContainer, borderRadius: Radius.control, padding: Spacing.sm, gap: Spacing.sm },
});
