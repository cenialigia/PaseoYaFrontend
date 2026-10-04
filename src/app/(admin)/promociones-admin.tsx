import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip, StatusChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { cambiarEstadoPromocion, listarPromocionesAdmin, type PromocionAdmin } from '@/data/admin';
import { etiquetaPromocion, type EstadoPromocion } from '@/data/catalogo-comercio';
import { useNow } from '@/hooks/use-now';
import { formatFechaHora } from '@/lib/format';

type Vista = EstadoPromocion | 'TODAS';
const VISTAS: { v: Vista; texto: string }[] = [
  { v: 'PENDIENTE', texto: 'Por revisar' },
  { v: 'APROBADA', texto: 'Aprobadas' },
  { v: 'PAUSADA', texto: 'Pausadas' },
  { v: 'RECHAZADA', texto: 'Rechazadas' },
  { v: 'TODAS', texto: 'Todas' },
];

// ADM-11 · Promociones (DEC-F14-11): revisar las de los comercios, pausar o reactivar y crear las propias.
export default function PromocionesAdmin() {
  const { recargar } = useCatalogo();
  const [lista, setLista] = useState<PromocionAdmin[] | null>(null);
  const [error, setError] = useState(false);
  const [vista, setVista] = useState<Vista>('PENDIENTE');
  const ahora = useNow();

  const cargar = useCallback(() => {
    let activo = true;
    listarPromocionesAdmin().then((r) => {
      if (!activo) return;
      setError(r === null);
      if (r) setLista(r);
    });
    return () => {
      activo = false;
    };
  }, []);
  useFocusEffect(cargar);

  const cambiar = (p: PromocionAdmin, estado: EstadoPromocion, titulo: string, texto: string) =>
    Alert.alert(titulo, texto, [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          const ok = await cambiarEstadoPromocion(p.id, estado);
          setError(!ok);
          if (!ok) return;
          setLista((ls) => ls?.map((x) => (x.id === p.id ? { ...x, estado } : x)) ?? null);
          void recargar();
        },
      },
    ]);

  if (error && !lista) return <ErrorState title="No se pudieron cargar las promociones" onAction={cargar} />;
  if (!lista) return <LoadingState label="Cargando promociones" />;
  const visibles = lista.filter((p) => vista === 'TODAS' || p.estado === vista);

  return (
    <Screen>
      <Button label="Nueva promoción" onPress={() => router.push({ pathname: '/promocion-form/[promocionId]', params: { promocionId: 'nueva' } })} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar por estado">
        {VISTAS.map(({ v, texto }) => (
          <FilterChip
            key={v}
            label={`${texto} (${lista.filter((p) => v === 'TODAS' || p.estado === v).length})`}
            selected={vista === v}
            onPress={() => setVista(v)}
          />
        ))}
      </ScrollView>
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudo completar la acción. Intenta de nuevo.
        </AppText>
      ) : null}
      {visibles.length === 0 ? (
        <EmptyState title="Sin promociones en esta lista" />
      ) : (
        visibles.map((p) => {
          const vencida = p.fin < ahora;
          return (
            <Card key={p.id} accessibilityLabel={`${p.producto} de ${p.comercio}, ${p.porcentaje} por ciento, ${etiquetaPromocion[p.estado].texto}`}>
              <View style={styles.fila}>
                <AppText variant="titleSm" style={styles.flex}>
                  {p.producto} · -{p.porcentaje}%
                </AppText>
                <StatusChip label={vencida ? 'Vencida' : etiquetaPromocion[p.estado].texto} tone={vencida ? 'entregado' : etiquetaPromocion[p.estado].tono} />
              </View>
              <AppText variant="bodySm" color="onSurfaceVariant">
                {p.comercio}
              </AppText>
              <AppText variant="caption" color="onSurfaceVariant">
                Del {formatFechaHora(p.inicio)} al {formatFechaHora(p.fin)}
              </AppText>
              <View style={styles.acciones}>
                {p.estado === 'PENDIENTE' ? (
                  <>
                    <Button
                      label="Aprobar"
                      variant="secondary"
                      onPress={() => cambiar(p, 'APROBADA', `¿Aprobar -${p.porcentaje}% en ${p.producto}?`, 'Los clientes verán el descuento y el servidor lo cobrará en cada pedido.')}
                    />
                    <Button label="Rechazar" variant="outline" onPress={() => cambiar(p, 'RECHAZADA', '¿Rechazar la promoción?', `${p.comercio} recibirá un aviso.`)} />
                  </>
                ) : null}
                {p.estado === 'APROBADA' ? (
                  <Button label="Pausar" variant="outline" onPress={() => cambiar(p, 'PAUSADA', '¿Pausar la promoción?', 'Los clientes dejarán de ver el descuento.')} />
                ) : null}
                {p.estado === 'PAUSADA' ? (
                  <Button label="Reactivar" variant="outline" onPress={() => cambiar(p, 'APROBADA', '¿Reactivar la promoción?', 'Los clientes volverán a ver el descuento.')} />
                ) : null}
                <Button label="Editar" variant="ghost" onPress={() => router.push({ pathname: '/promocion-form/[promocionId]', params: { promocionId: p.id } })} />
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  acciones: { gap: Spacing.sm, marginTop: Spacing.xs },
});
