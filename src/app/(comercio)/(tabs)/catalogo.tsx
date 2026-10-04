import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ComercioHeader } from '@/components/comercio-header';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data/catalogo';
import { cambiarActivo, listarProductosComercio, type ProductoComercio } from '@/data/catalogo-comercio';
import { normalizeSearch } from '@/lib/format';
import { useAuth } from '@/state/auth';

type Vista = 'todos' | 'activos' | 'inactivos' | 'sin-stock';

// COM-06 · Productos del comercio (RF-27–31): catálogo propio con búsqueda, filtros y activación confirmada.
export default function CatalogoComercio() {
  const { usuario } = useAuth();
  const { recargar: recargarCatalogo } = useCatalogo();
  const comercioId = usuario?.comercioId ?? '';
  const [productos, setProductos] = useState<ProductoComercio[] | null>(null);
  const [error, setError] = useState(false);
  const [vista, setVista] = useState<Vista>('todos');
  const [texto, setTexto] = useState('');

  // Recarga al volver del detalle o del formulario.
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

  const alternar = (p: ProductoComercio) =>
    Alert.alert(
      p.activo ? `¿Desactivar ${p.nombre}?` : `¿Activar ${p.nombre}?`,
      p.activo ? 'Los clientes dejarán de verlo. Su historial de pedidos se conserva.' : 'Los clientes volverán a verlo en tu tienda.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: p.activo ? 'Desactivar' : 'Activar',
          onPress: async () => {
            const ok = await cambiarActivo(p.id, !p.activo);
            setError(!ok);
            if (!ok) return;
            setProductos((ps) => ps?.map((x) => (x.id === p.id ? { ...x, activo: !p.activo } : x)) ?? null);
            void recargarCatalogo();
          },
        },
      ],
    );

  const header = <ComercioHeader title="Productos" />;
  if (error && !productos) return <ErrorState title="No se pudo cargar el catálogo" onAction={() => router.replace('/catalogo')} />;
  if (!productos) return <LoadingState label="Cargando catálogo" />;

  const q = normalizeSearch(texto);
  const filtrados = productos.filter(
    (p) =>
      (!q || normalizeSearch(p.nombre).includes(q)) &&
      (vista === 'activos' ? p.activo : vista === 'inactivos' ? !p.activo : vista === 'sin-stock' ? p.stock === 0 : true),
  );

  return (
    <Screen header={header}>
      <Button label="Nuevo producto" onPress={() => router.push({ pathname: '/editar-producto/[productoId]', params: { productoId: 'nuevo' } })} />
      <SearchField value={texto} onChangeText={setTexto} placeholder="Buscar en mis productos" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar productos">
        <FilterChip label={`Todos (${productos.length})`} selected={vista === 'todos'} onPress={() => setVista('todos')} />
        <FilterChip label="Activos" selected={vista === 'activos'} onPress={() => setVista('activos')} />
        <FilterChip label="Inactivos" selected={vista === 'inactivos'} onPress={() => setVista('inactivos')} />
        <FilterChip label="Sin stock" selected={vista === 'sin-stock'} onPress={() => setVista('sin-stock')} />
      </ScrollView>
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudo completar la última acción. Intenta de nuevo.
        </AppText>
      ) : null}
      {filtrados.length === 0 ? (
        <EmptyState title={q ? 'Sin resultados' : 'Sin productos en esta lista'} />
      ) : (
        filtrados.map((p) => (
          <Card
            key={p.id}
            onPress={() => router.push({ pathname: '/producto-comercio/[productoId]', params: { productoId: p.id } })}
            accessibilityLabel={`${p.nombre}, ${p.activo ? 'activo' : 'inactivo'}, stock ${p.stock}. Ver detalle`}>
            <View style={styles.fila}>
              <View style={styles.miniatura}>
                {p.imagenUrl ? (
                  <Image source={{ uri: p.imagenUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <MaterialIcons name="inventory-2" size={28} color={Colors.outline} />
                )}
              </View>
              <View style={styles.flex}>
                <AppText variant="titleSm">{p.nombre}</AppText>
                <PriceText amount={p.precio} previous={p.precioAnterior} />
                <AppText variant="labelSm" color={p.stock === 0 ? 'error' : 'onSurfaceVariant'}>
                  {p.stock === 0 ? 'Sin stock' : `Stock: ${p.stock}`}
                </AppText>
              </View>
              <Switch
                value={p.activo}
                onValueChange={() => alternar(p)}
                accessibilityLabel={`${p.nombre} activo`}
                trackColor={{ true: Colors.secondary, false: Colors.outlineVariant }}
                thumbColor={Colors.surfaceContainerLowest}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
  miniatura: {
    width: 64,
    height: 64,
    borderRadius: Radius.control,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
