import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data/catalogo';
import { etiquetaPromocion, listarPromocionesComercio, pausarPromocion, type PromocionComercio } from '@/data/catalogo-comercio';
import { formatFechaHora } from '@/lib/format';
import { useAuth } from '@/state/auth';

// DEC-F14-11 · Promociones del comercio con su estado de revisión; se crean desde el detalle de cada producto.
export default function PromocionesComercio() {
  const { usuario } = useAuth();
  const { recargar } = useCatalogo();
  const [promos, setPromos] = useState<PromocionComercio[] | null>(null);
  const [error, setError] = useState(false);

  const cargar = useCallback(() => {
    let activo = true;
    listarPromocionesComercio(usuario?.comercioId ?? '').then((r) => {
      if (!activo) return;
      setError(r === null);
      if (r) setPromos(r);
    });
    return () => {
      activo = false;
    };
  }, [usuario?.comercioId]);

  useFocusEffect(cargar);

  const pausar = (x: PromocionComercio) =>
    Alert.alert(`¿Pausar el ${x.porcentaje}% en ${x.producto}?`, 'Los clientes dejarán de ver el descuento. Para reactivarla tendrás que crear una nueva.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Pausar',
        onPress: async () => {
          const ok = await pausarPromocion(x.id);
          setError(!ok);
          if (ok) {
            setPromos((ps) => ps?.map((p) => (p.id === x.id ? { ...p, estado: 'PAUSADA' } : p)) ?? null);
            void recargar();
          }
        },
      },
    ]);

  if (error && !promos) return <ErrorState title="No se pudieron cargar tus promociones" onAction={cargar} />;
  if (!promos) return <LoadingState label="Cargando promociones" />;

  return (
    <Screen>
      <AppText variant="bodySm" color="onSurfaceVariant">
        Las promociones son descuentos en % con fecha de fin. La administración de Paseo Aranjuez las revisa antes de publicarlas.
      </AppText>
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudo completar la acción. Intenta de nuevo.
        </AppText>
      ) : null}
      {promos.length === 0 ? (
        <EmptyState
          title="Aún no tienes promociones"
          message="Abre un producto en la pestaña Productos y toca «Crear promoción»."
          actionLabel="Ir a productos"
          onAction={() => router.navigate('/catalogo')}
        />
      ) : (
        promos.map((x) => (
          <Card key={x.id} accessibilityLabel={`${x.producto}, ${x.porcentaje} por ciento, ${etiquetaPromocion[x.estado].texto}`}>
            <View style={styles.fila}>
              <AppText variant="titleSm" style={styles.flex}>
                {x.producto} · -{x.porcentaje}%
              </AppText>
              <StatusChip label={etiquetaPromocion[x.estado].texto} tone={etiquetaPromocion[x.estado].tono} />
            </View>
            <AppText variant="caption" color="onSurfaceVariant">
              Del {formatFechaHora(x.inicio)} al {formatFechaHora(x.fin)}
            </AppText>
            {x.estado === 'APROBADA' || x.estado === 'PENDIENTE' ? <Button label="Pausar" variant="ghost" onPress={() => pausar(x)} /> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
});
