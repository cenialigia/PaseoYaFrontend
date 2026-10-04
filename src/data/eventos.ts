import { useEffect, useState } from 'react';

import type { EstadoPago, EstadoPedido } from '@/data/modelo';
import { supabase } from '@/lib/supabase';

// RNF-06 · Historial del pedido: cada cambio de estado o de pago con su fecha y quién lo hizo (null = sistema).
export type EventoPedido = { id: number; estado: EstadoPedido; estadoPago: EstadoPago; creadoEn: number; actor?: string };

type Fila = { id: number; estado: EstadoPedido; estado_pago: EstadoPago; creado_en: string; actor_id: string | null; perfiles: { nombre: string } | null };

async function obtenerEventos(pedidoId: string): Promise<EventoPedido[]> {
  // El nombre del autor sólo llega al admin (RLS de perfiles); para los demás queda vacío.
  const { data, error } = await supabase
    .from('pedido_eventos')
    .select('id, estado, estado_pago, creado_en, actor_id, perfiles(nombre)')
    .eq('pedido_id', pedidoId)
    .order('id');
  if (error || !data) return [];
  return (data as unknown as Fila[]).map((f) => ({
    id: f.id,
    estado: f.estado,
    estadoPago: f.estado_pago,
    creadoEn: Date.parse(f.creado_en),
    actor: f.actor_id ? (f.perfiles?.nombre ?? undefined) : 'Sistema',
  }));
}

// Se vuelve a leer cuando cambia el estado o el pago del pedido (Realtime ya actualiza esos campos).
export function useEventosPedido(pedidoId: string, clave: string): EventoPedido[] {
  const [eventos, setEventos] = useState<EventoPedido[]>([]);
  useEffect(() => {
    let activo = true;
    obtenerEventos(pedidoId).then((e) => {
      if (activo) setEventos(e);
    });
    return () => {
      activo = false;
    };
  }, [pedidoId, clave]);
  return eventos;
}
