import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { haceCuanto } from '@/lib/format';
import { useNotificaciones, type Notificacion } from '@/state/notificaciones';

type Vista = 'todas' | 'pedido' | 'pago' | 'promocion';

const icono: Record<string, keyof typeof MaterialIcons.glyphMap> = { pedido: 'receipt-long', pago: 'check-circle', promocion: 'local-offer' };

// CLI-25 / COM-14 · Notificaciones (DEC-F14-05): las genera el servidor; tocar una la marca como leída y abre su pedido.
export function ListaAvisos({ alAbrir, vacio }: { alAbrir: (n: Notificacion) => void; vacio: string }) {
  const { lista, noLeidas, marcarLeida, marcarTodas } = useNotificaciones();
  const [vista, setVista] = useState<Vista>('todas');
  const ahora = useNow();
  const visibles = lista.filter((n) => vista === 'todas' || n.tipo === vista);

  const abrir = (n: Notificacion) => {
    void marcarLeida(n.id);
    alAbrir(n);
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerRight: () => (noLeidas > 0 ? <Button label="Marcar todas" variant="ghost" onPress={() => void marcarTodas()} /> : null) }} />
      <View style={styles.chips}>
        <FilterChip label="Todas" selected={vista === 'todas'} onPress={() => setVista('todas')} />
        <FilterChip label="Pedidos" selected={vista === 'pedido'} onPress={() => setVista('pedido')} />
        <FilterChip label="Pagos" selected={vista === 'pago'} onPress={() => setVista('pago')} />
        {lista.some((n) => n.tipo === 'promocion') ? (
          <FilterChip label="Promociones" selected={vista === 'promocion'} onPress={() => setVista('promocion')} />
        ) : null}
      </View>
      {visibles.length === 0 ? (
        <EmptyState title="No tienes notificaciones" message={vacio} />
      ) : (
        visibles.map((n) => (
          <Pressable
            key={n.id}
            accessibilityRole="button"
            accessibilityLabel={`${n.leida ? '' : 'No leída. '}${n.titulo}. ${n.cuerpo}. ${haceCuanto(n.creadoEn, ahora)}`}
            onPress={() => abrir(n)}
            style={[styles.item, !n.leida && styles.noLeida]}>
            <MaterialIcons name={icono[n.tipo] ?? 'notifications'} size={26} color={Colors.primary} />
            <View style={styles.flex}>
              <AppText variant="label">{n.titulo}</AppText>
              <AppText variant="bodySm" color="onSurfaceVariant">
                {n.cuerpo}
              </AppText>
              <AppText variant="caption" color="onSurfaceVariant">
                {haceCuanto(n.creadoEn, ahora)}
              </AppText>
            </View>
            {!n.leida ? <View style={styles.punto} /> : null}
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  item: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest, alignItems: 'flex-start' },
  noLeida: { backgroundColor: Colors.primaryFixed },
  flex: { flex: 1, gap: 2 },
  punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginTop: 6 },
});
