import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth';

export type Notificacion = {
  id: string;
  pedidoId?: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  creadoEn: number;
};

type NotificacionesValue = {
  lista: Notificacion[];
  noLeidas: number;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodas: () => Promise<void>;
};

const NotificacionesContext = createContext<NotificacionesValue | null>(null);

type Fila = { id: string; pedido_id: string | null; tipo: string; titulo: string; cuerpo: string; leida: boolean; creado_en: string };

async function obtener(): Promise<Notificacion[] | null> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('id, pedido_id, tipo, titulo, cuerpo, leida, creado_en')
    .order('creado_en', { ascending: false })
    .limit(50);
  if (error) return null;
  return (data as Fila[]).map((f) => ({
    id: f.id,
    pedidoId: f.pedido_id ?? undefined,
    tipo: f.tipo,
    titulo: f.titulo,
    cuerpo: f.cuerpo,
    leida: f.leida,
    creadoEn: Date.parse(f.creado_en),
  }));
}

// DEC-F14-05: las genera el servidor al cambiar un pedido; aquí sólo se leen y se marcan como leídas (Realtime).
export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [lista, setLista] = useState<Notificacion[]>([]);

  useEffect(() => {
    if (usuario?.rol !== 'CLIENTE') return;
    let activo = true;
    const refrescar = () => {
      obtener().then((n) => {
        if (activo && n) setLista(n);
      });
    };
    refrescar();
    const canal = supabase
      .channel(`notificaciones-${usuario.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones' }, refrescar)
      .subscribe();
    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, [usuario]);

  const marcarLeida = useCallback(async (id: string) => {
    setLista((l) => l.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
  }, []);

  const marcarTodas = useCallback(async () => {
    setLista((l) => l.map((n) => ({ ...n, leida: true })));
    await supabase.from('notificaciones').update({ leida: true }).eq('leida', false);
  }, []);

  return (
    <NotificacionesContext.Provider value={{ lista, noLeidas: lista.filter((n) => !n.leida).length, marcarLeida, marcarTodas }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones(): NotificacionesValue {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider');
  return ctx;
}
