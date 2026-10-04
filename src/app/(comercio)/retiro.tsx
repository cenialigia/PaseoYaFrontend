import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import { nombreLinea } from '@/components/pedido-comercio-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatPrice } from '@/lib/format';
import { mensajeRetiro, useOrders, type ResultadoRetiro } from '@/state/orders';

type Paso =
  | { tipo: 'leer' }
  | { tipo: 'verificando' }
  | { tipo: 'error'; resultado: ResultadoRetiro }
  | { tipo: 'verificado'; pedidoId: string; codigo: string }
  | { tipo: 'entregado'; codigoPedido: string };

// COM-05/06 · Gestionar retiro (DEC-F14-13/14): leer el QR del ticket con la cámara o escribir el PIN,
// verificar en el servidor sin consumir el código y, recién al confirmar, entregar.
// El código vive sólo en el estado de esta pantalla: no viaja en la ruta.
export default function Retiro() {
  const { pedidoId: pedidoElegido } = useLocalSearchParams<{ pedidoId?: string }>();
  const { pedidos, verificarRetiro, confirmarEntrega, confirmarEfectivo } = useOrders();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [modoPin, setModoPin] = useState(false);
  const [pin, setPin] = useState('');
  const [paso, setPaso] = useState<Paso>({ tipo: 'leer' });
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const verificar = async (codigo: string) => {
    setPaso({ tipo: 'verificando' });
    setAviso(null);
    const r = await verificarRetiro(codigo, pedidoElegido);
    if (r.resultado === 'ok' && r.pedidoId) setPaso({ tipo: 'verificado', pedidoId: r.pedidoId, codigo });
    else setPaso({ tipo: 'error', resultado: r.resultado });
  };

  const alLeer = ({ data }: BarcodeScanningResult) => {
    if (paso.tipo === 'leer') void verificar(data);
  };

  const reiniciar = () => {
    setPin('');
    setAviso(null);
    setPaso({ tipo: 'leer' });
  };

  if (paso.tipo === 'verificando') return <LoadingState label="Verificando código" />;

  if (paso.tipo === 'entregado') {
    return (
      <Screen>
        <View style={styles.exito} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <MaterialIcons name="check-circle" size={56} color={Colors.secondary} />
          <AppText variant="headline">Pedido entregado</AppText>
          <AppText variant="body" color="onSurfaceVariant" style={styles.centro}>
            {paso.codigoPedido} quedó como entregado y el código de recojo ya no se puede volver a usar.
          </AppText>
        </View>
        <Button label="Escanear otro retiro" onPress={reiniciar} />
        <Button label="Ir a pedidos" variant="outline" onPress={() => router.navigate('/ordenes')} />
      </Screen>
    );
  }

  if (paso.tipo === 'verificado') {
    const pedido = pedidos.find((p) => p.id === paso.pedidoId);
    if (!pedido) return <LoadingState label="Cargando pedido" />;
    const efectivoPendiente = pedido.pago.metodo === 'EFECTIVO' && pedido.pago.estado === 'PENDING';
    const pagado = pedido.pago.estado === 'PAID';

    const cobrar = () =>
      Alert.alert('¿Recibiste el efectivo?', `Confirma que el cliente te pagó ${formatPrice(pedido.total)}.`, [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Sí, cobré',
          onPress: async () => {
            setOcupado(true);
            const ok = await confirmarEfectivo(pedido.id);
            setOcupado(false);
            setAviso(ok ? null : 'No se pudo registrar el cobro. Intenta de nuevo.');
          },
        },
      ]);

    const entregar = () =>
      Alert.alert('¿Entregar el pedido?', 'El código se marcará como usado y el pedido quedará entregado.', [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Confirmar entrega',
          onPress: async () => {
            setOcupado(true);
            const r = await confirmarEntrega(pedido.id, paso.codigo);
            setOcupado(false);
            if (r === 'ok') setPaso({ tipo: 'entregado', codigoPedido: pedido.codigo });
            else setAviso(mensajeRetiro[r]);
          },
        },
      ]);

    return (
      <Screen>
        <View style={styles.valido} accessibilityRole="alert">
          <MaterialIcons name="verified" size={28} color={Colors.onSecondaryFixedVariant} />
          <AppText variant="label" color="onSecondaryFixedVariant" style={styles.flex}>
            Código válido para {pedido.codigo}
          </AppText>
        </View>
        <Card>
          <AppText variant="label">Productos</AppText>
          {pedido.lineas.map((l) => (
            <AppText key={l.productoId} variant="body">
              {l.cantidad} × {nombreLinea(l)}
            </AppText>
          ))}
          <AppText variant="titleSm" color="primary">
            Total {formatPrice(pedido.total)}
          </AppText>
        </Card>
        <Card>
          <AppText variant="label">Pago</AppText>
          <AppText variant="bodySm" color={pagado ? 'onSecondaryFixedVariant' : 'onTertiaryFixedVariant'}>
            {pagado
              ? pedido.pago.metodo === 'EFECTIVO'
                ? 'Efectivo cobrado'
                : 'Pagado con QR (simulado)'
              : efectivoPendiente
                ? `Pendiente: cobra ${formatPrice(pedido.total)} en efectivo antes de entregar.`
                : 'El pago QR todavía no está confirmado: no entregues el pedido.'}
          </AppText>
        </Card>
        {efectivoPendiente ? <Button label="Confirmar cobro en efectivo" variant="secondary" loading={ocupado} onPress={cobrar} /> : null}
        <Button label="Confirmar entrega" disabled={!pagado} loading={ocupado && pagado} onPress={entregar} />
        <Button label="Cancelar" variant="ghost" disabled={ocupado} onPress={reiniciar} />
        {aviso ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            {aviso}
          </AppText>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen>
      {paso.tipo === 'error' ? (
        <View style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <MaterialIcons name="error-outline" size={24} color={Colors.onErrorContainer} />
          <AppText variant="bodySm" color="onErrorContainer" style={styles.flex}>
            {mensajeRetiro[paso.resultado]}
          </AppText>
        </View>
      ) : null}

      {modoPin ? (
        <>
          <AppText variant="body" color="onSurfaceVariant">
            Escribe el PIN de 6 dígitos que aparece en el ticket del cliente.
          </AppText>
          <TextField label="PIN de recojo" value={pin} onChangeText={(t) => setPin(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={6} />
          <Button label="Verificar PIN" disabled={pin.length !== 6} onPress={() => verificar(pin)} />
          <Button label="Usar la cámara" variant="ghost" onPress={() => setModoPin(false)} />
        </>
      ) : !permiso ? (
        <LoadingState label="Preparando la cámara" />
      ) : !permiso.granted ? (
        <View style={styles.permiso}>
          <MaterialIcons name="no-photography" size={48} color={Colors.outline} />
          <AppText variant="body" color="onSurfaceVariant" style={styles.centro}>
            Para leer el QR del ticket necesitas permitir el uso de la cámara. También puedes escribir el PIN.
          </AppText>
          {permiso.canAskAgain ? (
            <Button label="Permitir cámara" onPress={() => void pedirPermiso()} />
          ) : (
            <Button label="Abrir ajustes" variant="outline" onPress={() => void Linking.openSettings()} />
          )}
          <Button label="Escribir PIN" variant="outline" onPress={() => setModoPin(true)} />
        </View>
      ) : (
        <>
          <AppText variant="body" color="onSurfaceVariant">
            Apunta la cámara al QR del ticket de recojo del cliente.
          </AppText>
          <View style={styles.camara}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={paso.tipo === 'leer' ? alLeer : undefined}
            />
            <View style={styles.marco} pointerEvents="none" />
          </View>
          {paso.tipo === 'error' ? <Button label="Escanear de nuevo" onPress={reiniciar} /> : null}
          <Button label="Escribir PIN" variant="outline" onPress={() => setModoPin(true)} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centro: { textAlign: 'center' },
  camara: { aspectRatio: 1, borderRadius: Radius.control, overflow: 'hidden', backgroundColor: Colors.onSurface, alignItems: 'center', justifyContent: 'center' },
  marco: { width: '65%', aspectRatio: 1, borderWidth: 3, borderColor: Colors.surfaceContainerLowest, borderRadius: Radius.control },
  permiso: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  error: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.errorContainer },
  valido: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.secondaryFixed },
  exito: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
});
