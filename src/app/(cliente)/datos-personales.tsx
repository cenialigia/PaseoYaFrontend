import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { isoADma, leerFecha } from '@/lib/format';
import { etiquetaGenero, TELEFONO, useAuth, type Genero } from '@/state/auth';

// F14-X-04 · Información personal editable por su dueño (DEC-F14-08). El correo no se cambia desde aquí.
export default function DatosPersonales() {
  const { usuario, actualizarPerfil } = useAuth();
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [genero, setGenero] = useState<Genero | undefined>(usuario?.genero);
  const [nacimiento, setNacimiento] = useState(isoADma(usuario?.fechaNacimiento));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<'ok' | 'error' | null>(null);

  const guardar = async () => {
    const e: Record<string, string> = {};
    if (nombre.trim().length < 2) e.nombre = 'Escribe tu nombre completo.';
    if (!TELEFONO.test(telefono.trim())) e.telefono = 'Escribe un teléfono válido.';
    const fecha = leerFecha(nacimiento);
    if (!fecha) e.nacimiento = 'Escribe la fecha como DD/MM/AAAA.';
    else if (fecha.edad < 13) e.nacimiento = 'Debes tener al menos 13 años.';
    if (!genero) e.genero = 'Elige una opción.';
    setErrores(e);
    setResultado(null);
    if (Object.keys(e).length > 0) return;
    setGuardando(true);
    const ok = await actualizarPerfil({ nombre: nombre.trim(), telefono: telefono.trim(), genero, fechaNacimiento: fecha!.iso });
    setGuardando(false);
    setResultado(ok ? 'ok' : 'error');
  };

  return (
    <Screen>
      <TextField label="Nombre completo" value={nombre} onChangeText={setNombre} error={errores.nombre} />
      <TextField label="Correo electrónico" value={usuario?.email ?? ''} editable={false} ayuda="El correo no se puede cambiar desde la app." />
      <TextField label="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" error={errores.telefono} ayuda="Lo ve la tienda sólo mientras tienes un pedido activo con ella." />
      <View style={styles.grupo} accessibilityRole="radiogroup" accessibilityLabel="Género">
        <AppText variant="label">Género</AppText>
        <View style={styles.chips}>
          {(Object.keys(etiquetaGenero) as Genero[]).map((g) => (
            <FilterChip key={g} label={etiquetaGenero[g]} selected={genero === g} onPress={() => setGenero(g)} />
          ))}
        </View>
        {errores.genero ? (
          <AppText variant="bodySm" color="error">
            {errores.genero}
          </AppText>
        ) : null}
      </View>
      <TextField label="Fecha de nacimiento" value={nacimiento} onChangeText={setNacimiento} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" error={errores.nacimiento} />
      {resultado === 'ok' ? (
        <AppText variant="bodySm" color="onSecondaryFixedVariant" accessibilityLiveRegion="polite">
          Tus datos se guardaron.
        </AppText>
      ) : resultado === 'error' ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudieron guardar. Intenta de nuevo.
        </AppText>
      ) : null}
      <Button label="Guardar cambios" loading={guardando} onPress={guardar} />
      <Button label="Volver" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
