import { router, useLocalSearchParams } from 'expo-router';

import { Confirmacion } from '@/components/confirmacion';
import { ErrorState } from '@/components/ui/state-views';
import { formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

// CLI-13 · Pago confirmado (simulado, DEC-F14-03): no se llama «cobro» porque no se mueve dinero.
export default function PagoConfirmado() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const pedido = useOrders().pedidos.find((p) => p.id === pedidoId);
  if (!pedido) return <ErrorState title="Pedido no encontrado" actionLabel="Ir a mis pedidos" onAction={() => router.navigate('/pedidos')} />;
  return (
    <Confirmacion
      titulo="¡Pago confirmado!"
      mensaje={`Tu pago simulado de ${formatPrice(pedido.total)} para el pedido ${pedido.codigo} fue aprobado.`}
      nota="Te avisaremos cuando tu pedido esté listo para recoger."
      pedidoId={pedido.id}
    />
  );
}
