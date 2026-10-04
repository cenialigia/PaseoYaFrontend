import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AdminHeader } from '@/components/admin-header';
import { nombreLinea, PedidoComercioCard } from '@/components/pedido-comercio-card';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { useCatalogo, type EstadoPedido, type MetodoPago, type Pedido } from '@/data';
import { normalizeSearch } from '@/lib/format';
import { useOrders } from '@/state/orders';

type Vista = 'curso' | 'entregados' | 'cancelados' | 'vencidos' | 'todos';

const estados: Record<Vista, EstadoPedido[] | null> = {
  curso: ['CONFIRMED', 'IN_PREPARATION', 'READY_FOR_PICKUP'],
  entregados: ['DELIVERED'],
  cancelados: ['CANCELLED'],
  vencidos: ['EXPIRED'],
  todos: null,
};
const etiquetas: Record<Vista, string> = { curso: 'En curso', entregados: 'Entregados', cancelados: 'Cancelados', vencidos: 'Vencidos', todos: 'Todos' };

// ADM-06 · Pedidos de toda la plaza (supervisión): búsqueda por código, cliente, comercio o producto; pago separado del estado.
export default function PedidosAdmin() {
  const { pedidos } = useOrders();
  const { comercios } = useCatalogo();
  const [vista, setVista] = useState<Vista>('curso');
  const [metodo, setMetodo] = useState<MetodoPago | 'todos'>('todos');
  const [texto, setTexto] = useState('');
  const q = normalizeSearch(texto);
  const coincide = (p: Pedido) =>
    !q ||
    normalizeSearch(`${p.codigo} ${p.clienteNombre ?? ''} ${comercios.find((c) => c.id === p.comercioId)?.nombre ?? ''}`).includes(q) ||
    p.lineas.some((l) => normalizeSearch(nombreLinea(l)).includes(q));
  const enVista = (p: Pedido, v: Vista) => !estados[v] || (estados[v] ?? []).includes(p.estado);
  const visibles = pedidos.filter((p) => enVista(p, vista) && (metodo === 'todos' || p.pago.metodo === metodo) && coincide(p));

  return (
    <Screen header={<AdminHeader title="Pedidos" />}>
      <SearchField value={texto} onChangeText={setTexto} placeholder="Código, cliente, comercio o producto" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar por estado">
        {(Object.keys(estados) as Vista[]).map((v) => (
          <FilterChip key={v} label={`${etiquetas[v]} (${pedidos.filter((p) => enVista(p, v)).length})`} selected={vista === v} onPress={() => setVista(v)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar por método de pago">
        <FilterChip label="Todos los pagos" selected={metodo === 'todos'} onPress={() => setMetodo('todos')} />
        <FilterChip label="QR simulado" selected={metodo === 'QR_SIMULADO'} onPress={() => setMetodo('QR_SIMULADO')} />
        <FilterChip label="Efectivo" selected={metodo === 'EFECTIVO'} onPress={() => setMetodo('EFECTIVO')} />
      </ScrollView>
      {visibles.length === 0 ? (
        <EmptyState title={q ? 'Sin resultados' : 'Sin pedidos en esta lista'} />
      ) : (
        visibles.map((p) => <PedidoComercioCard key={p.id} pedido={p} destino="admin" />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm },
});
