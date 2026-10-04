import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip, StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { esVenta, estadoPedidoUI, useCatalogo, type EstadoPedido } from '@/data';
import { cambiarEstadoComercio } from '@/data/admin';
import { cambiarActivo, listarProductosComercio, type ProductoComercio } from '@/data/catalogo-comercio';
import { formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

type Pestana = 'info' | 'productos' | 'estadisticas';
const ESTADOS: EstadoPedido[] = ['CONFIRMED', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED', 'EXPIRED'];

// ADM-03/08 · Detalle de comercio: información y estado, productos (sólo activar/desactivar) y estadísticas reales.
export default function ComercioAdmin() {
  const { comercioId } = useLocalSearchParams<{ comercioId: string }>();
  const { comercios, recargar } = useCatalogo();
  const { pedidos } = useOrders();
  const comercio = comercios.find((c) => c.id === comercioId);
  const [pestana, setPestana] = useState<Pestana>('info');
  const [productos, setProductos] = useState<ProductoComercio[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      listarProductosComercio(comercioId).then((r) => {
        if (activo) setProductos(r ?? []);
      });
      return () => {
        activo = false;
      };
    }, [comercioId]),
  );

  if (!comercio) return <ErrorState title="Comercio no encontrado" actionLabel="Volver" onAction={() => router.back()} />;
  const propios = pedidos.filter((p) => p.comercioId === comercio.id);
  const ventas = propios.filter(esVenta);
  const totalVentas = ventas.reduce((s, p) => s + p.total, 0);

  const cambiar = (cambios: { abierto?: boolean; activo?: boolean }, titulo: string, texto: string) =>
    Alert.alert(titulo, texto, [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setOcupado(true);
          const ok = await cambiarEstadoComercio(comercio.id, cambios);
          if (ok) await recargar();
          setOcupado(false);
          setError(ok ? null : 'No se pudo cambiar el estado del comercio.');
        },
      },
    ]);

  const alternarProducto = (p: ProductoComercio) =>
    Alert.alert(p.activo ? `¿Desactivar ${p.nombre}?` : `¿Activar ${p.nombre}?`, 'Precio y stock los gestiona el comercio; tú sólo cambias su visibilidad.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: p.activo ? 'Desactivar' : 'Activar',
        onPress: async () => {
          const ok = await cambiarActivo(p.id, !p.activo);
          if (!ok) return setError('No se pudo cambiar el producto.');
          setProductos((ps) => ps?.map((x) => (x.id === p.id ? { ...x, activo: !p.activo } : x)) ?? null);
          void recargar();
        },
      },
    ]);

  return (
    <Screen>
      <View style={styles.fila}>
        <AppText variant="headline" style={styles.flex}>
          {comercio.nombre}
        </AppText>
        <StatusChip label={!comercio.activo ? 'Inactivo' : comercio.abierto ? 'Abierto' : 'Cerrado'} tone={!comercio.activo ? 'entregado' : comercio.abierto ? 'listo' : 'cerrado'} />
      </View>
      <View style={styles.chips}>
        <FilterChip label="Información" selected={pestana === 'info'} onPress={() => setPestana('info')} />
        <FilterChip label={`Productos${productos ? ` (${productos.length})` : ''}`} selected={pestana === 'productos'} onPress={() => setPestana('productos')} />
        <FilterChip label="Estadísticas" selected={pestana === 'estadisticas'} onPress={() => setPestana('estadisticas')} />
      </View>
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}

      {pestana === 'info' ? (
        <>
          <Card>
            <Dato etiqueta="Categoría" valor={comercio.categoria} />
            <Dato etiqueta="Ubicación" valor={`${comercio.piso} · ${comercio.local}`} />
            <Dato etiqueta="Horario" valor={comercio.horario ?? 'Sin horario'} />
            <Dato etiqueta="Descripción" valor={comercio.descripcion ?? 'Sin descripción'} />
          </Card>
          <Button label="Editar información" onPress={() => router.push({ pathname: '/editar-comercio-admin/[comercioId]', params: { comercioId: comercio.id } })} />
          <Button
            label={comercio.abierto ? 'Cerrar tienda' : 'Abrir tienda'}
            variant="outline"
            loading={ocupado}
            onPress={() =>
              cambiar(
                { abierto: !comercio.abierto },
                comercio.abierto ? `¿Cerrar ${comercio.nombre}?` : `¿Abrir ${comercio.nombre}?`,
                comercio.abierto ? 'Los clientes no podrán hacer pedidos hasta que se abra.' : 'Los clientes podrán comprar y reservar.',
              )
            }
          />
          <Button
            label={comercio.activo ? 'Desactivar comercio' : 'Activar comercio'}
            variant={comercio.activo ? 'ghost' : 'secondary'}
            disabled={ocupado}
            onPress={() =>
              cambiar(
                { activo: !comercio.activo },
                comercio.activo ? `¿Desactivar ${comercio.nombre}?` : `¿Activar ${comercio.nombre}?`,
                comercio.activo ? 'Desaparecerá para los clientes. Sus pedidos e historial se conservan.' : 'Volverá a ser visible para los clientes.',
              )
            }
          />
        </>
      ) : null}

      {pestana === 'productos' ? (
        !productos ? (
          <LoadingState label="Cargando productos" />
        ) : productos.length === 0 ? (
          <EmptyState title="Este comercio no tiene productos" />
        ) : (
          productos.map((p) => (
            <Card
              key={p.id}
              onPress={() => router.push({ pathname: '/producto-admin/[productoId]', params: { productoId: p.id } })}
              accessibilityLabel={`${p.nombre}, ${p.activo ? 'activo' : 'inactivo'}, stock ${p.stock}`}>
              <View style={styles.fila}>
                <View style={styles.flex}>
                  <AppText variant="titleSm">{p.nombre}</AppText>
                  <PriceText amount={p.precio} previous={p.precioAnterior} />
                  <AppText variant="labelSm" color={p.stock === 0 ? 'error' : 'onSurfaceVariant'}>
                    {p.stock === 0 ? 'Sin stock' : `Stock: ${p.stock}`}
                  </AppText>
                </View>
                <Switch
                  value={p.activo}
                  onValueChange={() => alternarProducto(p)}
                  accessibilityLabel={`${p.nombre} activo`}
                  trackColor={{ true: Colors.secondary, false: Colors.outlineVariant }}
                  thumbColor={Colors.surfaceContainerLowest}
                />
              </View>
            </Card>
          ))
        )
      ) : null}

      {pestana === 'estadisticas' ? (
        <>
          <View style={styles.datos}>
            <Bloque titulo="Pedidos" valor={String(propios.length)} />
            <Bloque titulo="Vendido" valor={formatPrice(totalVentas)} />
            <Bloque titulo="Ticket promedio" valor={formatPrice(ventas.length ? totalVentas / ventas.length : 0)} />
          </View>
          <Card>
            {ESTADOS.map((e) => (
              <View key={e} style={styles.fila}>
                <AppText variant="bodySm" style={styles.flex}>
                  {estadoPedidoUI[e].etiqueta}
                </AppText>
                <AppText variant="label">{propios.filter((p) => p.estado === e).length}</AppText>
              </View>
            ))}
          </Card>
          <AppText variant="caption" color="onSurfaceVariant">
            Ventas = pedidos con el pago hecho. Sin reservas sin cobrar.
          </AppText>
        </>
      ) : null}
    </Screen>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <AppText variant="labelSm" color="onSurfaceVariant">
        {etiqueta}
      </AppText>
      <AppText variant="body">{valor}</AppText>
    </View>
  );
}

function Bloque({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <View style={styles.bloque} accessible accessibilityLabel={`${titulo}: ${valor}`}>
      <AppText variant="labelSm" color="onSurfaceVariant">
        {titulo}
      </AppText>
      <AppText variant="titleSm" color="primary">
        {valor}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dato: { gap: 2, paddingVertical: Spacing.xs },
  datos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  bloque: { flexGrow: 1, flexBasis: '30%', padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest, gap: 2 },
});
