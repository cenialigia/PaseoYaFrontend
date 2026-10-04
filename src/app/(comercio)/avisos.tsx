import { router } from 'expo-router';

import { ListaAvisos } from '@/components/lista-avisos';

export default function Avisos() {
  return (
    <ListaAvisos
      vacio="Te avisaremos cuando llegue un pedido, se pague o se cancele."
      alAbrir={(n) =>
        n.pedidoId ? router.push({ pathname: '/orden/[pedidoId]', params: { pedidoId: n.pedidoId } }) : n.tipo === 'promocion' ? router.push('/promociones-comercio') : undefined
      }
    />
  );
}
