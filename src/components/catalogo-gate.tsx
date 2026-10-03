import type { ReactNode } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { useCatalogo } from '@/data/catalogo';

export function CatalogoGate({ children }: { children: ReactNode }) {
  const { cargando, error, comercios, recargar } = useCatalogo();
  if (error) return <ErrorState title="Sin conexión con el servidor" message={error} onAction={() => void recargar()} />;
  if (cargando && comercios.length === 0) return <LoadingState label="Cargando catálogo" />;
  return <>{children}</>;
}
