import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip, StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { cambiarActivo, listarProductosComercio, type ProductoComercio } from '@/data/catalogo-comercio';
import { useCatalogo } from '@/data/catalogo';
import { useAuth } from '@/state/auth';

type Vista = 'todos' | 'activos' | 'inactivos' | 'sin-stock';

// LUI-08 · RF-27–31: catálogo propio del comercio.
export default function CatalogoComercio() {
  const { usuario } = useAuth();
  const { recargar: recargarCatalogo } = useCatalogo();
  const comercioId = usuario?.comercioId ?? '';
  const [productos, setProductos] = useState<ProductoComercio[] | null>(null);
  const [error, setError] = useState(false);
  const [vista, setVista] = useState<Vista>('todos');
  const [ocupado, setOcupado] = useState<string | null>(null);

  // Recarga al volver del formulario de edición.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      listarProductosComercio(comercioId).then((r) => {
        if (!activo) return;
        setError(r === null);
        if (r) setProductos(r);
      });
      return () => {
        activo = false;
      };
    }, [comercioId]),
  );

  const alternar = async (p: ProductoComercio) => {
    setOcupado(p.id);
    const ok = await cambiarActivo(p.id, !p.activo);
    setOcupado(null);
    if (!ok) return setError(true);
    setProductos((ps) => ps?.map((x) => (x.id === p.id ? { ...x, activo: !p.activo } : x)) ?? null);
    void recargarCatalogo();
  };

  if (error && !productos) return <ErrorState title="No se pudo cargar el catálogo" onAction={() => router.replace('/catalogo')} />;
  if (!productos) return <LoadingState label="Cargando catálogo" />;

  const filtrados = productos.filter((p) =>
    vista === 'activos' ? p.activo : vista === 'inactivos' ? !p.activo : vista === 'sin-stock' ? p.stock === 0 : true,
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Mi catálogo' }} />
      <Button label="Nuevo producto" onPress={() => router.push({ pathname: '/editar-producto/[productoId]', params: { productoId: 'nuevo' } })} />
      <View style={styles.chips}>
        <FilterChip label={`Todos (${productos.length})`} selected={vista === 'todos'} onPress={() => setVista('todos')} />
        <FilterChip label="Activos" selected={vista === 'activos'} onPress={() => setVista('activos')} />
        <FilterChip label="Inactivos" selected={vista === 'inactivos'} onPress={() => setVista('inactivos')} />
        <FilterChip label="Sin stock" selected={vista === 'sin-stock'} onPress={() => setVista('sin-stock')} />
      </View>
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudo completar la última acción. Intente de nuevo.
        </AppText>
      ) : null}
      {filtrados.length === 0 ? (
        <EmptyState title="Sin productos en esta lista" />
      ) : (
        filtrados.map((p) => (
          <Card key={p.id} accessibilityLabel={`${p.nombre}, ${p.activo ? 'activo' : 'inactivo'}, stock ${p.stock}`}>
            <View style={styles.row}>
              <AppText variant="titleSm" style={styles.nombre}>
                {p.nombre}
              </AppText>
              <StatusChip label={p.activo ? 'Activo' : 'Inactivo'} tone={p.activo ? 'listo' : 'entregado'} />
            </View>
            <PriceText amount={p.precio} previous={p.precioAnterior} />
            <AppText variant="labelSm" color={p.stock === 0 ? 'error' : 'onSurfaceVariant'}>
              {p.stock === 0 ? 'Sin stock' : `Stock: ${p.stock}`}
            </AppText>
            <View style={styles.acciones}>
              <Button
                label="Editar"
                variant="outline"
                accessibilityLabel={`Editar ${p.nombre}`}
                onPress={() => router.push({ pathname: '/editar-producto/[productoId]', params: { productoId: p.id } })}
              />
              <Button
                label={p.activo ? 'Desactivar' : 'Activar'}
                variant="ghost"
                accessibilityLabel={`${p.activo ? 'Desactivar' : 'Activar'} ${p.nombre}`}
                loading={ocupado === p.id}
                onPress={() => alternar(p)}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  nombre: { flexShrink: 1 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
