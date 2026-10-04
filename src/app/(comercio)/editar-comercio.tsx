import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { SelectorFoto } from '@/components/selector-foto';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Colors, Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { actualizarComercio, obtenerImagenComercio, type DatosComercio } from '@/data/catalogo-comercio';
import { useAuth } from '@/state/auth';

// COM-12 · Editar establecimiento (DEC-F14-07): la tienda cambia descripción, horario, foto y abierto/cerrado;
// nombre, categoría, piso y local los fija la administración (el servidor lo impone con un disparador).
export default function EditarComercio() {
  const { usuario } = useAuth();
  const { recargar, getComercio, comercios } = useCatalogo();
  const comercioId = usuario?.comercioId ?? '';
  const comercio = comercios.find((c) => c.id === comercioId);
  const [form, setForm] = useState<DatosComercio | null>(null);
  const [original, setOriginal] = useState<DatosComercio | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    let activo = true;
    obtenerImagenComercio(comercioId).then((imagenPath) => {
      if (!activo) return;
      const c = getComercio(comercioId);
      const inicial = { descripcion: c?.descripcion ?? '', horario: c?.horario ?? '', abierto: !!c?.abierto, imagenPath };
      setForm(inicial);
      setOriginal(inicial);
    });
    return () => {
      activo = false;
    };
  }, [comercioId, getComercio]);

  if (!form) return <LoadingState label="Cargando tu tienda" />;
  const sinGuardar = JSON.stringify(form) !== JSON.stringify(original);
  const cambiar = (campo: 'descripcion' | 'horario') => (t: string) => {
    setMensaje(null);
    setForm((x) => (x ? { ...x, [campo]: t } : x));
  };

  const guardar = async () => {
    setGuardando(true);
    const ok = await actualizarComercio(comercioId, form);
    if (ok) await recargar();
    setGuardando(false);
    if (ok) setOriginal(form);
    setMensaje(ok ? { ok: true, texto: 'Cambios guardados.' } : { ok: false, texto: 'No se pudieron guardar los cambios. Intenta de nuevo.' });
  };

  const volver = () => {
    if (!sinGuardar) return router.back();
    Alert.alert('¿Descartar los cambios?', 'Lo que cambiaste no se guardará.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <Screen>
      <Card accessibilityLabel={`${comercio?.nombre}, ${comercio?.categoria}, ${comercio?.piso}, ${comercio?.local}`}>
        <AppText variant="titleSm">{comercio?.nombre}</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {comercio?.categoria} · {comercio?.piso} · {comercio?.local}
        </AppText>
        <AppText variant="caption" color="onSurfaceVariant">
          El nombre, la categoría y la ubicación los cambia la administración de Paseo Aranjuez.
        </AppText>
      </Card>
      <View style={styles.fila}>
        <View style={styles.flex}>
          <AppText variant="label">Tienda abierta</AppText>
          <AppText variant="caption" color="onSurfaceVariant">
            Si la cierras, los clientes no podrán hacer pedidos.
          </AppText>
        </View>
        <Switch
          value={form.abierto}
          onValueChange={(abierto) => setForm((x) => (x ? { ...x, abierto } : x))}
          accessibilityLabel="Tienda abierta"
          trackColor={{ true: Colors.secondary, false: Colors.outlineVariant }}
          thumbColor={Colors.surfaceContainerLowest}
        />
      </View>
      <TextField label="Descripción" value={form.descripcion} onChangeText={cambiar('descripcion')} multiline maxLength={200} style={styles.multiline} />
      <TextField label="Horario de atención" value={form.horario} onChangeText={cambiar('horario')} maxLength={120} ayuda="Por ejemplo: Lun a dom · 10:00 a 22:00" />
      <SelectorFoto etiqueta="Foto de la tienda" carpeta={comercioId} path={form.imagenPath} onChange={(imagenPath) => setForm((x) => (x ? { ...x, imagenPath } : x))} />
      <Button label="Guardar cambios" disabled={!sinGuardar} loading={guardando} onPress={guardar} />
      <Button label="Volver" variant="ghost" disabled={guardando} onPress={volver} />
      {mensaje ? (
        <AppText variant="bodySm" color={mensaje.ok ? 'onSecondaryFixedVariant' : 'error'} accessibilityLiveRegion="polite">
          {mensaje.texto}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
  multiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: Spacing.sm },
});
