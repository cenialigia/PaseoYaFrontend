import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { GraficoBarras, ventasPorDia } from '@/components/grafico-barras';
import { AppText } from '@/components/ui/app-text';
import { FilterChip } from '@/components/ui/chip';
import { Screen, Section } from '@/components/ui/screen';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { esVenta, estadoPedidoUI, useCatalogo, type EstadoPedido } from '@/data';
import { listarUsuarios, type UsuarioAdmin } from '@/data/admin';
import { useNow } from '@/hooks/use-now';
import { formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

type Periodo = '7' | '30' | 'todo';
type Pestana = 'resumen' | 'ventas' | 'clientes';
const ESTADOS: EstadoPedido[] = ['CONFIRMED', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED', 'EXPIRED'];

const desde = (p: Periodo) => (p === 'todo' ? 0 : Date.now() - Number(p) * 86_400_000);

// ADM-10/11 · Analítica con definiciones explícitas: periodo por fecha de confirmación del pedido; venta = pago hecho.
export default function Analitica() {
  const { pedidos } = useOrders();
  const { comercios, categorias } = useCatalogo();
  const [periodo, setPeriodo] = useState<Periodo>('30');
  const [pestana, setPestana] = useState<Pestana>('resumen');
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const ahora = useNow();

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      listarUsuarios().then((u) => {
        if (activo && u) setUsuarios(u);
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  const enPeriodo = pedidos.filter((p) => p.confirmadoEn >= desde(periodo));
  const ventas = enPeriodo.filter(esVenta);
  const total = ventas.reduce((s, p) => s + p.total, 0);
  const categoriaDe = (comercioId: string) => comercios.find((c) => c.id === comercioId)?.categoriaId;
  const porCategoria = categorias
    .map((k) => ({ nombre: k.nombre, valor: ventas.filter((p) => categoriaDe(p.comercioId) === k.id).reduce((s, p) => s + p.total, 0) }))
    .sort((a, b) => b.valor - a.valor);
  const porComercio = comercios
    .map((c) => ({ nombre: c.nombre, valor: ventas.filter((p) => p.comercioId === c.id).reduce((s, p) => s + p.total, 0) }))
    .filter((x) => x.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);
  const clientes = usuarios.filter((u) => u.rol === 'CLIENTE');
  const conPedidos = new Set(enPeriodo.map((p) => p.clienteId));
  const nuevos = clientes.filter((u) => u.creadoEn >= desde(periodo));

  return (
    <Screen>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Periodo">
        <FilterChip label="7 días" selected={periodo === '7'} onPress={() => setPeriodo('7')} />
        <FilterChip label="30 días" selected={periodo === '30'} onPress={() => setPeriodo('30')} />
        <FilterChip label="Todo" selected={periodo === 'todo'} onPress={() => setPeriodo('todo')} />
      </ScrollView>
      <View style={styles.chipsFila}>
        <FilterChip label="Resumen" selected={pestana === 'resumen'} onPress={() => setPestana('resumen')} />
        <FilterChip label="Ventas" selected={pestana === 'ventas'} onPress={() => setPestana('ventas')} />
        <FilterChip label="Clientes" selected={pestana === 'clientes'} onPress={() => setPestana('clientes')} />
      </View>

      {pestana === 'resumen' ? (
        <>
          <View style={styles.datos}>
            <Bloque titulo="Pedidos" valor={String(enPeriodo.length)} />
            <Bloque titulo="Comercios activos" valor={String(comercios.filter((c) => c.activo).length)} />
            <Bloque titulo="Usuarios" valor={String(usuarios.length)} />
          </View>
          <Section title="Pedidos por estado">
            <Barras filas={ESTADOS.map((e) => ({ nombre: estadoPedidoUI[e].etiqueta, valor: enPeriodo.filter((p) => p.estado === e).length }))} formato={String} />
          </Section>
        </>
      ) : null}

      {pestana === 'ventas' ? (
        <>
          <View style={styles.datos}>
            <Bloque titulo="Total vendido" valor={formatPrice(total)} />
            <Bloque titulo="Pedidos con venta" valor={String(ventas.length)} />
            <Bloque titulo="Ticket promedio" valor={formatPrice(ventas.length ? total / ventas.length : 0)} />
          </View>
          <GraficoBarras titulo={periodo === '7' ? 'Ventas por día' : 'Ventas por día (últimos 30)'} barras={ventasPorDia(pedidos, periodo === '7' ? 7 : 30, ahora)} />
          <Section title="Por categoría">
            <Barras filas={porCategoria} formato={formatPrice} />
          </Section>
          <Section title="Comercios que más venden">
            {porComercio.length ? (
              <Barras filas={porComercio} formato={formatPrice} />
            ) : (
              <AppText variant="bodySm" color="onSurfaceVariant">
                Sin ventas en este periodo.
              </AppText>
            )}
          </Section>
        </>
      ) : null}

      {pestana === 'clientes' ? (
        <View style={styles.datos}>
          <Bloque titulo="Clientes registrados" valor={String(clientes.length)} />
          <Bloque titulo="Nuevos en el periodo" valor={String(nuevos.length)} />
          <Bloque titulo="Con pedidos en el periodo" valor={String(conPedidos.size)} />
          <Bloque titulo="Inactivos" valor={String(clientes.filter((u) => !u.activo).length)} />
        </View>
      ) : null}

      <AppText variant="caption" color="onSurfaceVariant">
        Periodo según la fecha de confirmación de cada pedido. Una venta es un pedido con el pago hecho (QR simulado o efectivo cobrado). Datos de demostración.
      </AppText>
    </Screen>
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

// Barras horizontales simples: proporción respecto del mayor valor, con el número siempre escrito.
function Barras({ filas, formato }: { filas: { nombre: string; valor: number }[]; formato: (n: number) => string }) {
  const max = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <View style={styles.barras}>
      {filas.map((f) => (
        <View key={f.nombre} accessible accessibilityLabel={`${f.nombre}: ${formato(f.valor)}`} style={styles.barraFila}>
          <View style={styles.barraTexto}>
            <AppText variant="bodySm" style={styles.flex}>
              {f.nombre}
            </AppText>
            <AppText variant="label">{formato(f.valor)}</AppText>
          </View>
          <View style={styles.pista}>
            <View style={[styles.barra, { width: `${(f.valor / max) * 100}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm },
  chipsFila: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  flex: { flex: 1 },
  datos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  bloque: { flexGrow: 1, flexBasis: '45%', padding: Spacing.md, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest, gap: 2 },
  barras: { gap: Spacing.md },
  barraFila: { gap: 4 },
  barraTexto: { flexDirection: 'row', gap: Spacing.sm },
  pista: { height: 10, borderRadius: 5, backgroundColor: Colors.surfaceContainer, overflow: 'hidden' },
  barra: { height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});
