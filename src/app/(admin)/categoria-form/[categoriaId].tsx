import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { eliminarCategoria, guardarCategoria, listarCategoriasAdmin, type CategoriaAdmin } from '@/data/admin';

const ICONOS: (keyof typeof MaterialIcons.glyphMap)[] = ['devices', 'checkroom', 'restaurant', 'watch', 'storefront', 'menu-book', 'sports-esports', 'spa', 'local-cafe', 'toys'];

type Form = Omit<CategoriaAdmin, 'id'> & { ordenTexto: string };

// ADM-10 · Crear o editar categoría: nombre único, ícono, orden y estado. Sólo se borra si no tiene comercios.
export default function CategoriaForm() {
  const { categoriaId } = useLocalSearchParams<{ categoriaId: string }>();
  const nueva = categoriaId === 'nueva';
  const { recargar } = useCatalogo();
  const [f, setF] = useState<Form | null>(nueva ? { nombre: '', icono: 'storefront', orden: 0, ordenTexto: '0', activa: true } : null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (nueva) return;
    let activo = true;
    listarCategoriasAdmin().then((r) => {
      const k = r?.find((x) => x.id === categoriaId);
      if (activo && k) setF({ ...k, ordenTexto: String(k.orden) });
    });
    return () => {
      activo = false;
    };
  }, [nueva, categoriaId]);

  if (!f) return <LoadingState label="Cargando categoría" />;
  const valido = f.nombre.trim().length >= 2 && /^\d{1,3}$/.test(f.ordenTexto);

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    const r = await guardarCategoria(nueva ? null : categoriaId, { nombre: f.nombre, icono: f.icono, orden: Number(f.ordenTexto), activa: f.activa });
    setGuardando(false);
    if (r === 'duplicada') return setError('Ya existe una categoría con ese nombre.');
    if (r === 'red') return setError('No se pudo guardar. Intenta de nuevo.');
    await recargar();
    router.back();
  };

  const eliminar = () =>
    Alert.alert(`¿Eliminar ${f.nombre}?`, 'Sólo se puede eliminar si ningún comercio la usa. Si no, desactívala.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const r = await eliminarCategoria(categoriaId);
          if (r === 'ok') {
            await recargar();
            return router.back();
          }
          setError(r === 'con-comercios' ? 'Esta categoría tiene comercios: desactívala en lugar de eliminarla.' : 'No se pudo eliminar. Intenta de nuevo.');
        },
      },
    ]);

  return (
    <Screen>
      <TextField label="Nombre" value={f.nombre} onChangeText={(nombre) => setF((x) => (x ? { ...x, nombre } : x))} maxLength={40} />
      <AppText variant="label">Ícono</AppText>
      <View style={styles.iconos}>
        {ICONOS.map((i) => (
          <Pressable
            key={i}
            accessibilityRole="radio"
            accessibilityState={{ selected: f.icono === i }}
            accessibilityLabel={`Ícono ${i}`}
            onPress={() => setF((x) => (x ? { ...x, icono: i } : x))}
            style={[styles.icono, f.icono === i && styles.iconoElegido]}>
            <MaterialIcons name={i} size={26} color={f.icono === i ? Colors.onPrimary : Colors.primary} />
          </Pressable>
        ))}
      </View>
      <TextField label="Orden en la app" value={f.ordenTexto} onChangeText={(t) => setF((x) => (x ? { ...x, ordenTexto: t.replace(/\D/g, '') } : x))} keyboardType="number-pad" maxLength={3} />
      <View style={styles.fila}>
        <AppText variant="label" style={styles.flex}>
          Visible para los clientes
        </AppText>
        <Switch
          value={f.activa}
          onValueChange={(activa) => setF((x) => (x ? { ...x, activa } : x))}
          accessibilityLabel="Categoría activa"
          trackColor={{ true: Colors.secondary, false: Colors.outlineVariant }}
          thumbColor={Colors.surfaceContainerLowest}
        />
      </View>
      <Button label={nueva ? 'Crear categoría' : 'Guardar cambios'} disabled={!valido} loading={guardando} onPress={guardar} />
      {!nueva ? <Button label="Eliminar categoría" variant="ghost" disabled={guardando} onPress={eliminar} /> : null}
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  icono: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoElegido: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
});
