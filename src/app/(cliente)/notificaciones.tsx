import { router } from 'expo-router';

import { ListaAvisos } from '@/components/lista-avisos';

export default function Notificaciones() {
  return (
    <ListaAvisos
      vacio="Te avisaremos cuando tu pedido cambie de estado."
      alAbrirPedido={(pedidoId) => router.push({ pathname: '/pedido/[pedidoId]/detalle', params: { pedidoId } })}
    />
  );
}
