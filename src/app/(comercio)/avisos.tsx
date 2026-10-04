import { router } from 'expo-router';

import { ListaAvisos } from '@/components/lista-avisos';

export default function Avisos() {
  return (
    <ListaAvisos
      vacio="Te avisaremos cuando llegue un pedido, se pague o se cancele."
      alAbrirPedido={(pedidoId) => router.push({ pathname: '/orden/[pedidoId]', params: { pedidoId } })}
    />
  );
}
