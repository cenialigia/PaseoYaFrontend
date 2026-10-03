import { EmptyState } from '@/components/ui/state-views';

// El comportamiento de los avisos espera DEC-20.
export default function NotificacionesScreen() {
  return <EmptyState title="Sin avisos" message="Los avisos no están disponibles en esta versión de demostración." />;
}
