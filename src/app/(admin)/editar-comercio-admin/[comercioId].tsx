import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { ErrorState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { actualizarComercioAdmin, type DatosComercioAdmin } from '@/data/admin';

// ADM-03 · «Editar información»: el admin fija nombre, categoría y ubicación (DEC-F14-07) y puede corregir descripción y horario.
export default function EditarComercioAdmin() {
  const { comercioId } = useLocalSearchParams<{ comercioId: string }>();
  const { comercios, categorias, recargar } = useCatalogo();
  const comercio = comercios.find((c) => c.id === comercioId);
  const inicial: DatosComercioAdmin | null = comercio
    ? { nombre: comercio.nombre, categoriaId: comercio.categoriaId, piso: comercio.piso, local: comercio.local, descripcion: comercio.descripcion ?? '', horario: comercio.horario ?? '' }
    : null;
  const [f, setF] = useState<DatosComercioAdmin | null>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!comercio || !f || !inicial) return <ErrorState title="Comercio no encontrado" actionLabel="Volver" onAction={() => router.back()} />;
  const sinGuardar = JSON.stringify(f) !== JSON.stringify(inicial);
  const valido = f.nombre.trim().length >= 2 && !!f.piso.trim() && !!f.local.trim();
  const cambiar = (k: keyof DatosComercioAdmin) => (t: string) => setF((x) => (x ? { ...x, [k]: t } : x));

  const guardar = async () => {
    setGuardando(true);
    const ok = await actualizarComercioAdmin(comercio.id, f);
    if (ok) await recargar();
    setGuardando(false);
    if (!ok) return setError('No se pudieron guardar los cambios. Intenta de nuevo.');
    router.back();
  };

  const cancelar = () => {
    if (!sinGuardar) return router.back();
    Alert.alert('¿Descartar los cambios?', 'Lo que cambiaste no se guardará.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <Screen>
      <TextField label="Nombre" value={f.nombre} onChangeText={cambiar('nombre')} error={f.nombre.trim().length < 2 ? 'Escribe el nombre.' : undefined} />
      <AppText variant="label">Categoría</AppText>
      <View style={styles.chips}>
        {categorias.map((k) => (
          <FilterChip key={k.id} label={k.nombre} selected={f.categoriaId === k.id} onPress={() => setF((x) => (x ? { ...x, categoriaId: k.id } : x))} />
        ))}
      </View>
      <View style={styles.fila}>
        <View style={styles.flex}>
          <TextField label="Piso" value={f.piso} onChangeText={cambiar('piso')} />
        </View>
        <View style={styles.flex}>
          <TextField label="Local" value={f.local} onChangeText={cambiar('local')} />
        </View>
      </View>
      <TextField label="Descripción" value={f.descripcion} onChangeText={cambiar('descripcion')} multiline maxLength={200} style={styles.multiline} />
      <TextField label="Horario" value={f.horario} onChangeText={cambiar('horario')} maxLength={120} />
      <Button label="Guardar cambios" disabled={!sinGuardar || !valido} loading={guardando} onPress={guardar} />
      <Button label="Cancelar" variant="ghost" disabled={guardando} onPress={cancelar} />
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  fila: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
  multiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: Spacing.sm },
});
