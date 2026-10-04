import { router, useLocalSearchParams } from 'expo-router';

import { Confirmacion } from '@/components/confirmacion';
import { ErrorState } from '@/components/ui/state-views';
import { formatFechaHora, formatPrice } from '@/lib/format';
import { useOrders } from '@/state/orders';

// CLI-17 · Reserva creada: el pago es en efectivo al recoger, con plazo de 72 h (DEC-06).
export default function ReservaConfirmada() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const pedido = useOrders().pedidos.find((p) => p.id === pedidoId);
  if (!pedido) return <ErrorState title="Pedido no encontrado" actionLabel="Ir a mis pedidos" onAction={() => router.navigate('/pedidos')} />;
  return (
    <Confirmacion
      titulo="¡Reserva creada!"
      mensaje={`Tu pedido ${pedido.codigo} ha sido reservado. Pagas ${formatPrice(pedido.total)} en la tienda al recoger.`}
      nota={`Tienes hasta el ${formatFechaHora(pedido.venceEn)} para recogerlo.`}
      pedidoId={pedido.id}
    />
  );
}
