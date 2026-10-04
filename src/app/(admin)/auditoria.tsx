import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { listarAuditoria, nombreAccion, nombreTabla, type RegistroAuditoria } from '@/data/admin';
import { formatFechaHora } from '@/lib/format';

// Campos que conviene mostrar en el resumen; el registro completo queda en la base.
const CAMPOS = ['nombre', 'estado', 'activo', 'abierto', 'activa', 'porcentaje', 'piso', 'local', 'rol'];

const resumen = (r: RegistroAuditoria) =>
  Object.entries(r.cambios)
    .filter(([k]) => CAMPOS.includes(k))
    .map(([k, v]) => `${k}: ${typeof v === 'boolean' ? (v ? 'sí' : 'no') : String(v)}`)
    .join(' · ');

// DEC-F14-06 · Auditoría: cada cambio que hace un admin queda registrado por el servidor (sólo lectura).
export default function Auditoria() {
  const [lista, setLista] = useState<RegistroAuditoria[] | null>(null);
  const [error, setError] = useState(false);

  const cargar = useCallback(() => {
    let activo = true;
    listarAuditoria().then((r) => {
      if (!activo) return;
      setError(r === null);
      if (r) setLista(r);
    });
    return () => {
      activo = false;
    };
  }, []);
  useFocusEffect(cargar);

  if (error && !lista) return <ErrorState title="No se pudo cargar la auditoría" onAction={cargar} />;
  if (!lista) return <LoadingState label="Cargando auditoría" />;

  return (
    <Screen>
      <AppText variant="bodySm" color="onSurfaceVariant">
        Últimas 60 acciones de la administración.
      </AppText>
      {lista.length === 0 ? (
        <EmptyState title="Sin acciones registradas" />
      ) : (
        lista.map((r) => (
          <Card key={r.id}>
            <AppText variant="label">
              {nombreAccion[r.accion] ?? r.accion} {(nombreTabla[r.tabla] ?? r.tabla).toLowerCase()}
            </AppText>
            {resumen(r) ? (
              <AppText variant="bodySm" color="onSurfaceVariant">
                {resumen(r)}
              </AppText>
            ) : null}
            <AppText variant="caption" color="onSurfaceVariant">
              {formatFechaHora(r.creadoEn)} · {r.admin}
            </AppText>
          </Card>
        ))
      )}
    </Screen>
  );
}
