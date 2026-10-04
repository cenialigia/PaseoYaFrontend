import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { useCatalogo } from '@/data';
import { formatFechaHora } from '@/lib/format';
import { useOrders } from '@/state/orders';

// DEC-20 · Reportes que envían los clientes desde su perfil; sólo los ve la administración.
export default function Reportes() {
  const { reportes, pedidos } = useOrders();
  const { comercios } = useCatalogo();

  return (
    <Screen>
      {reportes.length === 0 ? (
        <EmptyState title="Sin reportes" message="Cuando un cliente reporte un problema, aparecerá aquí." />
      ) : (
        reportes.map((r) => {
          const p = pedidos.find((x) => x.id === r.pedidoId);
          const comercio = p ? comercios.find((c) => c.id === p.comercioId)?.nombre : undefined;
          return (
            <Card
              key={r.id}
              onPress={p ? () => router.push({ pathname: '/pedido-admin/[pedidoId]', params: { pedidoId: p.id } }) : undefined}
              accessibilityLabel={`${p ? `Pedido ${p.codigo}` : 'Sin pedido'}: ${r.mensaje}`}>
              <AppText variant="label">{p ? `${p.codigo} · ${comercio ?? ''}` : 'Sin pedido asociado'}</AppText>
              <AppText variant="bodySm">{r.mensaje}</AppText>
              <AppText variant="caption" color="onSurfaceVariant">
                {formatFechaHora(r.creadoEn)}
                {p?.clienteNombre ? ` · ${p.clienteNombre}` : ''}
              </AppText>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
