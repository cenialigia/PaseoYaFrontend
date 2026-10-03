import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/state/auth';
import { useOrders } from '@/state/orders';

export default function PerfilScreen() {
  const { usuario, salir } = useAuth();
  const { pedidos, reportar } = useOrders();
  const [pedidoId, setPedidoId] = useState<string | undefined>(undefined);
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(false);

  const enviar = () => {
    reportar(mensaje.trim(), pedidoId);
    setMensaje('');
    setPedidoId(undefined);
    setEnviado(true);
  };

  return (
    <Screen>
      <Card>
        <AppText variant="titleSm">{usuario?.nombre}</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {usuario?.email} · Cliente
        </AppText>
      </Card>

      {/* DEC-20: «Reportar problema» vive en el perfil del usuario. */}
      <Section title="Reportar un problema">
        <AppText variant="bodySm" color="onSurfaceVariant">
          Elija el pedido, si corresponde, y describa el problema. La administración de Paseo Aranjuez lo revisará.
        </AppText>
        <View style={styles.chips}>
          <FilterChip label="Sin pedido" selected={!pedidoId} onPress={() => setPedidoId(undefined)} />
          {pedidos.slice(0, 6).map((p) => (
            <FilterChip key={p.id} label={p.codigo} selected={pedidoId === p.id} onPress={() => setPedidoId(p.id)} />
          ))}
        </View>
        <TextField label="Descripción" value={mensaje} onChangeText={(t) => { setMensaje(t); setEnviado(false); }} multiline numberOfLines={4} style={styles.multiline} />
        <Button label="Enviar reporte" disabled={mensaje.trim().length < 5} onPress={enviar} />
        {enviado ? (
          <AppText variant="bodySm" color="onSecondaryFixedVariant" accessibilityLiveRegion="polite">
            Reporte enviado. Gracias por avisarnos.
          </AppText>
        ) : null}
      </Section>

      <Button label="Cerrar sesión" variant="outline" onPress={salir} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: Spacing.sm },
});
