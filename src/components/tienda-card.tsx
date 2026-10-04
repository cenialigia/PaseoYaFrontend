import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Visual } from '@/components/producto-visual';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import type { Comercio } from '@/data';

export function TiendaCard({ comercio }: { comercio: Comercio }) {
  return (
    <Card
      onPress={() => router.push({ pathname: '/comercio/[comercioId]', params: { comercioId: comercio.id } })}
      accessibilityLabel={`${comercio.nombre}, ${comercio.piso}, ${comercio.local}, ${comercio.abierto ? 'abierta' : 'cerrada'}`}>
      <View style={styles.fila}>
        <Visual url={comercio.imagenUrl} icono="storefront" alto={56} estilo={styles.logo} />
        <View style={styles.flex}>
          <View style={styles.titulo}>
            <AppText variant="titleSm">{comercio.nombre}</AppText>
            <StatusChip label={comercio.abierto ? 'Abierta' : 'Cerrada'} tone={comercio.abierto ? 'listo' : 'cerrado'} />
          </View>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {comercio.piso} · {comercio.local}
          </AppText>
          {comercio.descripcion ? (
            <AppText variant="caption" color="onSurfaceVariant" numberOfLines={1}>
              {comercio.descripcion}
            </AppText>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  logo: { width: 56 },
  flex: { flex: 1, gap: 2 },
  titulo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
});
