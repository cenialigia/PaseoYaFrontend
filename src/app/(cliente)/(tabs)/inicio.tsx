import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MiniProducto } from '@/components/mini-producto';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { ESTADOS_EN_CURSO, estadoPedidoUI, getComercio, useCatalogo } from '@/data';
import { supabase } from '@/lib/supabase';
import { useOrders } from '@/state/orders';

function Titulo({ texto, accion, onAccion }: { texto: string; accion?: string; onAccion?: () => void }) {
  return (
    <View style={styles.titulo}>
      <AppText variant="title" accessibilityRole="header">
        {texto}
      </AppText>
      {accion && onAccion ? <Button label={accion} variant="ghost" onPress={onAccion} /> : null}
    </View>
  );
}

// CLI-06 · Inicio (DEC-F14-02): buscador, categorías, promociones, mis pedidos y más pedidos.
export default function Inicio() {
  const { categorias, productos } = useCatalogo();
  const { pedidos } = useOrders();
  const [masPedidosIds, setMasPedidosIds] = useState<string[]>([]);

  // Conteos agregados del servidor (sin datos de otros clientes); se refrescan al volver a Inicio.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      supabase.rpc('productos_mas_pedidos', { p_limite: 6 }).then(({ data }) => {
        if (activo && data) setMasPedidosIds((data as { producto_id: string }[]).map((r) => r.producto_id));
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  const promociones = productos.filter((p) => p.descuento);
  const enCurso = pedidos.filter((p) => ESTADOS_EN_CURSO.includes(p.estado)).slice(0, 2);
  const masPedidos = masPedidosIds.map((id) => productos.find((p) => p.id === id)).filter((p) => p !== undefined);

  return (
    <Screen title="Inicio">
      <Pressable accessibilityRole="search" accessibilityLabel="Buscar productos o tiendas" onPress={() => router.push('/buscar')} style={styles.buscador}>
        <MaterialIcons name="search" size={22} color={Colors.onSurfaceVariant} />
        <AppText variant="body" color="onSurfaceVariant">
          Buscar productos o tiendas
        </AppText>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrusel} accessibilityLabel="Categorías">
        {categorias.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Categoría ${c.nombre}`}
            onPress={() => router.push({ pathname: '/categoria/[categoriaId]', params: { categoriaId: c.id } })}
            style={styles.categoria}>
            <View style={styles.iconoCategoria}>
              <MaterialIcons name={c.icono as keyof typeof MaterialIcons.glyphMap} size={28} color={Colors.primary} />
            </View>
            <AppText variant="labelSm">{c.nombre}</AppText>
          </Pressable>
        ))}
      </ScrollView>

      <View>
        <Titulo texto="Promociones para ti" accion="Ver todas" onAccion={() => router.navigate('/promociones')} />
        {promociones.length === 0 ? (
          <AppText variant="bodySm" color="onSurfaceVariant">
            No hay promociones activas por ahora.
          </AppText>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrusel}>
            {promociones.map((p) => (
              <MiniProducto key={p.id} producto={p} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.seccion}>
        <Titulo texto="Mis pedidos" accion="Ver todos" onAccion={() => router.navigate('/pedidos')} />
        {enCurso.length === 0 ? (
          <EmptyState title="No tienes pedidos en curso" message="Cuando compres o reserves, los verás aquí." />
        ) : (
          enCurso.map((p) => {
            const c = getComercio(p.comercioId);
            const e = estadoPedidoUI[p.estado];
            return (
              <Card
                key={p.id}
                onPress={() => router.push({ pathname: '/pedido/[pedidoId]/detalle', params: { pedidoId: p.id } })}
                accessibilityLabel={`Pedido ${p.codigo} en ${c?.nombre}, ${e.etiqueta}`}>
                <View style={styles.titulo}>
                  <AppText variant="titleSm">{c?.nombre}</AppText>
                  <StatusChip label={e.etiqueta} tone={e.tono} />
                </View>
                <AppText variant="bodySm" color="onSurfaceVariant">
                  {p.codigo} · {p.pago.metodo === 'EFECTIVO' ? 'Reserva' : 'Compra'}
                </AppText>
                <PriceText amount={p.total} />
              </Card>
            );
          })
        )}
      </View>

      {masPedidos.length > 0 ? (
        <View>
          <Titulo texto="Más pedidos" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrusel}>
            {masPedidos.map((p) => (
              <MiniProducto key={p.id} producto={p} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.aviso}>
        <AppText variant="bodySm" color="onPrimaryFixedVariant">
          Todos los pedidos se recogen en persona en el local de cada tienda.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  carrusel: { gap: Spacing.gutter, paddingVertical: Spacing.xs },
  categoria: { alignItems: 'center', gap: Spacing.xs, minWidth: 76 },
  iconoCategoria: { width: 60, height: 60, borderRadius: Radius.card, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  titulo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  seccion: { gap: Spacing.gutter },
  aviso: { backgroundColor: Colors.primaryFixed, borderRadius: Radius.control, padding: Spacing.md },
});
