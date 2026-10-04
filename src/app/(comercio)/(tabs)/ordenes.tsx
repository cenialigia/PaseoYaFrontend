import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ComercioHeader } from '@/components/comercio-header';
import { nombreLinea, PedidoComercioCard } from '@/components/pedido-comercio-card';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import type { EstadoPedido, MetodoPago, Pedido } from '@/data';
import { normalizeSearch } from '@/lib/format';
import { useAuth } from '@/state/auth';
import { useOrders } from '@/state/orders';

type Vista = 'nuevos' | 'preparando' | 'listos' | 'historial';

const estados: Record<Vista, EstadoPedido[]> = {
  nuevos: ['CONFIRMED'],
  preparando: ['IN_PREPARATION'],
  listos: ['READY_FOR_PICKUP'],
  historial: ['DELIVERED', 'CANCELLED', 'EXPIRED'],
};

// COM-02 · Pedidos del comercio (RLS: sólo los propios), por estado, método de pago y búsqueda por código o producto.
export default function OrdenesComercio() {
  const { usuario } = useAuth();
  const { pedidos } = useOrders();
  const [vista, setVista] = useState<Vista>('nuevos');
  const [metodo, setMetodo] = useState<MetodoPago | 'todos'>('todos');
  const [texto, setTexto] = useState('');
  const propios = pedidos.filter((p) => p.comercioId === usuario?.comercioId);
  const contar = (v: Vista) => propios.filter((p) => estados[v].includes(p.estado)).length;
  const q = normalizeSearch(texto);
  const coincide = (p: Pedido) => !q || normalizeSearch(p.codigo).includes(q) || p.lineas.some((l) => normalizeSearch(nombreLinea(l)).includes(q));
  const visibles = propios.filter((p) => estados[vista].includes(p.estado) && (metodo === 'todos' || p.pago.metodo === metodo) && coincide(p));

  return (
    <Screen header={<ComercioHeader title="Pedidos" />}>
      <SearchField value={texto} onChangeText={setTexto} placeholder="Buscar por código o producto" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar por estado">
        <FilterChip label={`Nuevos (${contar('nuevos')})`} selected={vista === 'nuevos'} onPress={() => setVista('nuevos')} />
        <FilterChip label={`En preparación (${contar('preparando')})`} selected={vista === 'preparando'} onPress={() => setVista('preparando')} />
        <FilterChip label={`Listos (${contar('listos')})`} selected={vista === 'listos'} onPress={() => setVista('listos')} />
        <FilterChip label={`Historial (${contar('historial')})`} selected={vista === 'historial'} onPress={() => setVista('historial')} />
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar por método de pago">
        <FilterChip label="Todos los pagos" selected={metodo === 'todos'} onPress={() => setMetodo('todos')} />
        <FilterChip label="QR simulado" selected={metodo === 'QR_SIMULADO'} onPress={() => setMetodo('QR_SIMULADO')} />
        <FilterChip label="Efectivo" selected={metodo === 'EFECTIVO'} onPress={() => setMetodo('EFECTIVO')} />
      </ScrollView>
      {visibles.length === 0 ? (
        <EmptyState title={q ? 'Sin resultados' : 'Sin pedidos en esta lista'} message={q ? 'Prueba con otro código o producto.' : undefined} />
      ) : (
        visibles.map((p) => <PedidoComercioCard key={p.id} pedido={p} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm },
});
