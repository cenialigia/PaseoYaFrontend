import { router } from 'expo-router';

import { ListaAvisos } from '@/components/lista-avisos';

export default function AvisosAdmin() {
  return (
    <ListaAvisos
      vacio="Te avisaremos cuando un comercio proponga una promoción."
      alAbrir={(n) =>
        n.pedidoId ? router.push({ pathname: '/pedido-admin/[pedidoId]', params: { pedidoId: n.pedidoId } }) : n.tipo === 'promocion' ? router.push('/promociones-admin') : undefined
      }
    />
  );
}
