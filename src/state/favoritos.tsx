import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth';

type FavoritosValue = {
  ids: Set<string>;
  esFavorito: (productoId: string) => boolean;
  alternar: (productoId: string) => Promise<boolean>;
};

const FavoritosContext = createContext<FavoritosValue | null>(null);

// DEC-F14-05: favoritos guardados en la base por usuario (RLS: cada uno sólo los suyos).
export function FavoritosProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (usuario?.rol !== 'CLIENTE') return;
    let activo = true;
    supabase
      .from('favoritos')
      .select('producto_id')
      .then(({ data }) => {
        if (activo && data) setIds(new Set(data.map((f) => f.producto_id as string)));
      });
    return () => {
      activo = false;
    };
  }, [usuario]);

  const alternar = useCallback(
    async (productoId: string) => {
      const quitar = ids.has(productoId);
      // Actualización optimista; si el servidor falla se revierte.
      setIds((s) => {
        const n = new Set(s);
        if (quitar) n.delete(productoId);
        else n.add(productoId);
        return n;
      });
      const { error } = quitar
        ? await supabase.from('favoritos').delete().eq('producto_id', productoId)
        : await supabase.from('favoritos').insert({ producto_id: productoId });
      if (error) {
        setIds((s) => {
          const n = new Set(s);
          if (quitar) n.add(productoId);
          else n.delete(productoId);
          return n;
        });
        return false;
      }
      return true;
    },
    [ids],
  );

  return <FavoritosContext.Provider value={{ ids, esFavorito: (id) => ids.has(id), alternar }}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos(): FavoritosValue {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error('useFavoritos debe usarse dentro de FavoritosProvider');
  return ctx;
}
