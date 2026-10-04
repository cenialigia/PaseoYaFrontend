import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useOrders } from '@/state/orders';

// DEC-20 · «Reportar problema» desde el perfil; lo revisa la administración de Paseo Aranjuez.
export default function Reportar() {
  const { pedidos, reportar } = useOrders();
  const [pedidoId, setPedidoId] = useState<string | undefined>(undefined);
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState<'enviado' | 'error' | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    const ok = await reportar(mensaje.trim(), pedidoId);
    setEnviando(false);
    setEstado(ok ? 'enviado' : 'error');
    if (ok) {
      setMensaje('');
      setPedidoId(undefined);
    }
  };

  return (
    <Screen>
      <AppText variant="bodySm" color="onSurfaceVariant">
        Elige el pedido, si corresponde, y cuéntanos qué pasó. La administración de Paseo Aranjuez lo revisará.
      </AppText>
      <View style={styles.chips}>
        <FilterChip label="Sin pedido" selected={!pedidoId} onPress={() => setPedidoId(undefined)} />
        {pedidos.slice(0, 6).map((p) => (
          <FilterChip key={p.id} label={p.codigo} selected={pedidoId === p.id} onPress={() => setPedidoId(p.id)} />
        ))}
      </View>
      <TextField
        label="Descripción"
        value={mensaje}
        onChangeText={(t) => {
          setMensaje(t);
          setEstado(null);
        }}
        multiline
        numberOfLines={4}
        style={styles.multiline}
      />
      <Button label="Enviar reporte" disabled={mensaje.trim().length < 5} loading={enviando} onPress={enviar} />
      {estado === 'enviado' ? (
        <AppText variant="bodySm" color="onSecondaryFixedVariant" accessibilityLiveRegion="polite">
          Reporte enviado. ¡Gracias por avisarnos!
        </AppText>
      ) : estado === 'error' ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudo enviar el reporte. Intenta de nuevo.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: Spacing.sm },
});
