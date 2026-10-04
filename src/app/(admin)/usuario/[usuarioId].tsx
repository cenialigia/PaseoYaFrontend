import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { cambiarEstadoUsuario, eliminarCuentaCliente, etiquetaRol, listarUsuarios, type UsuarioAdmin } from '@/data/admin';
import { esVenta } from '@/data';
import { formatFechaHora, formatPrice } from '@/lib/format';
import { useAuth } from '@/state/auth';
import { useOrders } from '@/state/orders';

// ADM-05 · Detalle de usuario: datos que existen en el modelo, actividad real y activar/desactivar (DEC-F14-06). Sin cambios de rol.
export default function UsuarioAdminDetalle() {
  const { usuarioId } = useLocalSearchParams<{ usuarioId: string }>();
  const { usuario: yo } = useAuth();
  const { pedidos } = useOrders();
  const [u, setU] = useState<UsuarioAdmin | null | undefined>(undefined);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    listarUsuarios().then((r) => {
      if (activo) setU(r?.find((x) => x.id === usuarioId) ?? null);
    });
    return () => {
      activo = false;
    };
  }, [usuarioId]);

  if (u === undefined) return <LoadingState label="Cargando usuario" />;
  if (u === null) return <ErrorState title="Usuario no encontrado" actionLabel="Volver" onAction={() => router.back()} />;
  const usuario = u;
  const propios = pedidos.filter((p) => p.clienteId === usuario.id);
  const gastado = propios.filter(esVenta).reduce((s, p) => s + p.total, 0);
  const esYo = yo?.id === usuario.id;

  const alternar = () =>
    Alert.alert(
      usuario.activo ? `¿Desactivar a ${usuario.nombre}?` : `¿Activar a ${usuario.nombre}?`,
      usuario.activo ? 'No podrá iniciar sesión. Sus pedidos e historial se conservan.' : 'Podrá volver a iniciar sesión.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: usuario.activo ? 'Desactivar' : 'Activar',
          onPress: async () => {
            setOcupado(true);
            const ok = await cambiarEstadoUsuario(usuario.id, !usuario.activo);
            setOcupado(false);
            setError(ok ? null : 'No se pudo cambiar el estado. Intenta de nuevo.');
            if (ok) setU({ ...usuario, activo: !usuario.activo });
          },
        },
      ],
    );

  const eliminar = () =>
    Alert.alert(`¿Eliminar los datos de ${usuario.nombre}?`, 'Se borran sus datos personales y su foto; sus pedidos quedan anónimos. No se puede deshacer.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setOcupado(true);
          const r = await eliminarCuentaCliente(usuario.id);
          setOcupado(false);
          if (r === 'ok') return setU({ ...usuario, nombre: 'Cliente eliminado', telefono: undefined, activo: false, eliminado: true });
          setError(r === 'pedidos-activos' ? 'Tiene pedidos en curso: deben retirarse o cancelarse antes.' : 'No se pudo eliminar. Intenta de nuevo.');
        },
      },
    ]);

  return (
    <Screen>
      <View style={styles.fila}>
        <AppText variant="headline" style={styles.flex}>
          {usuario.nombre}
        </AppText>
        <StatusChip label={usuario.eliminado ? 'Eliminado' : usuario.activo ? 'Activo' : 'Inactivo'} tone={usuario.activo ? 'listo' : 'cerrado'} />
      </View>
      <Card>
        <Dato etiqueta="Correo" valor={usuario.email} />
        <Dato etiqueta="Rol" valor={etiquetaRol[usuario.rol] + (usuario.comercio ? ` · ${usuario.comercio}` : '')} />
        {usuario.telefono ? <Dato etiqueta="Teléfono" valor={usuario.telefono} /> : null}
        <Dato etiqueta="Alta" valor={formatFechaHora(usuario.creadoEn)} />
        <Dato etiqueta="Último acceso" valor={usuario.ultimoAcceso ? formatFechaHora(usuario.ultimoAcceso) : 'Nunca'} />
      </Card>
      {usuario.rol === 'CLIENTE' ? (
        <Card>
          <Dato etiqueta="Pedidos" valor={String(propios.length)} />
          <Dato etiqueta="Total pagado" valor={formatPrice(gastado)} />
        </Card>
      ) : null}
      {usuario.comercioId ? (
        <Button label="Ver comercio" variant="outline" onPress={() => router.push({ pathname: '/comercio-admin/[comercioId]', params: { comercioId: usuario.comercioId ?? '' } })} />
      ) : null}
      {usuario.eliminado ? (
        <AppText variant="caption" color="onSurfaceVariant">
          Cuenta eliminada a pedido (DEC-24): sus datos personales ya no existen.
        </AppText>
      ) : esYo ? (
        <AppText variant="caption" color="onSurfaceVariant">
          Es tu cuenta: no puedes desactivarla.
        </AppText>
      ) : (
        <Button label={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'} variant={usuario.activo ? 'outline' : 'secondary'} loading={ocupado} onPress={alternar} />
      )}
      {usuario.rol === 'CLIENTE' && !usuario.eliminado ? <Button label="Eliminar datos del cliente" variant="ghost" disabled={ocupado} onPress={eliminar} /> : null}
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <AppText variant="labelSm" color="onSurfaceVariant">
        {etiqueta}
      </AppText>
      <AppText variant="body">{valor}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  dato: { gap: 2, paddingVertical: Spacing.xs },
});
