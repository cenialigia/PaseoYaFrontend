import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/chip';
import { PasswordField, TextField } from '@/components/ui/text-field';
import { Colors, Spacing } from '@/constants/theme';
import { etiquetaGenero, mensajeAuth, TELEFONO, useAuth, type ErrorAuth, type Genero } from '@/state/auth';
import { leerFecha } from '@/lib/format';

type Errores = Partial<Record<'nombre' | 'email' | 'telefono' | 'password' | 'confirmar' | 'genero' | 'nacimiento', string>>;

function fuerza(p: string): { texto: string; color: 'error' | 'onTertiaryFixedVariant' | 'secondary' } {
  const puntos = [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
  if (p.length < 8 || puntos <= 1) return { texto: 'Contraseña débil', color: 'error' };
  if (puntos <= 2) return { texto: 'Contraseña media', color: 'onTertiaryFixedVariant' };
  return { texto: 'Contraseña segura', color: 'secondary' };
}

// CLI-03 · Registro con los datos del PDF (DEC-F14-08). El servidor vuelve a validar y siempre crea un CLIENTE.
export default function Registro() {
  const { registrarCliente } = useAuth();
  const insets = useSafeAreaInsets();
  const [f, setF] = useState({ nombre: '', email: '', telefono: '+591 ', password: '', confirmar: '', nacimiento: '' });
  const [genero, setGenero] = useState<Genero | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [errorServidor, setErrorServidor] = useState<ErrorAuth | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (k: keyof typeof f) => (t: string) => setF((x) => ({ ...x, [k]: t }));

  const validar = (): Errores => {
    const e: Errores = {};
    if (f.nombre.trim().length < 2) e.nombre = 'Escribe tu nombre completo.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = 'Escribe un correo válido.';
    if (!TELEFONO.test(f.telefono.trim())) e.telefono = 'Escribe un teléfono válido, por ejemplo +591 70000000.';
    if (f.password.length < 8) e.password = 'Usa al menos 8 caracteres.';
    if (f.confirmar !== f.password) e.confirmar = 'Las contraseñas no coinciden.';
    if (!genero) e.genero = 'Elige una opción.';
    const fecha = leerFecha(f.nacimiento);
    if (!fecha) e.nacimiento = 'Escribe la fecha como DD/MM/AAAA.';
    else if (fecha.edad < 13) e.nacimiento = 'Debes tener al menos 13 años.';
    return e;
  };

  const crear = async () => {
    const e = validar();
    setErrores(e);
    setErrorServidor(null);
    if (Object.keys(e).length > 0 || !genero) return;
    setEnviando(true);
    const r = await registrarCliente({
      nombre: f.nombre,
      email: f.email,
      password: f.password,
      telefono: f.telefono,
      genero,
      fechaNacimiento: leerFecha(f.nacimiento)!.iso,
    });
    setEnviando(false);
    setErrorServidor(r);
  };

  const pw = fuerza(f.password);

  return (
    <KeyboardAvoidingView behavior="height" style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]} keyboardShouldPersistTaps="handled">
        <AppText variant="headline" accessibilityRole="header">
          Crear cuenta
        </AppText>
        <TextField label="Nombre completo" value={f.nombre} onChangeText={cambiar('nombre')} autoComplete="name" error={errores.nombre} />
        <TextField label="Correo electrónico" value={f.email} onChangeText={cambiar('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errores.email} />
        <TextField label="Teléfono" value={f.telefono} onChangeText={cambiar('telefono')} keyboardType="phone-pad" autoComplete="tel" error={errores.telefono} />
        <PasswordField label="Contraseña" value={f.password} onChangeText={cambiar('password')} autoComplete="new-password" error={errores.password} />
        {f.password ? (
          <AppText variant="labelSm" color={pw.color} accessibilityLiveRegion="polite">
            {pw.texto}
          </AppText>
        ) : null}
        <PasswordField label="Confirmar contraseña" value={f.confirmar} onChangeText={cambiar('confirmar')} autoComplete="new-password" error={errores.confirmar} />
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
        <TextField label="Fecha de nacimiento" value={f.nacimiento} onChangeText={cambiar('nacimiento')} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" error={errores.nacimiento} />
        {errorServidor ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            {mensajeAuth[errorServidor]}
          </AppText>
        ) : null}
        <Button label="Continuar" loading={enviando} onPress={crear} />
        <Button label="Ya tengo cuenta" variant="ghost" onPress={() => router.replace('/ingresar')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.screen, gap: Spacing.md },
  grupo: { gap: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
