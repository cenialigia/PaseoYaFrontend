import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PasswordField, TextField } from '@/components/ui/text-field';
import { Colors, Spacing } from '@/constants/theme';
import { mensajeAuth, useAuth, type ErrorAuth } from '@/state/auth';

// DEC-F14-09 · Recuperación con código de 6 dígitos enviado por correo (sin enlaces profundos).
export default function Recuperar() {
  const { enviarCodigoRecuperacion, restablecerContrasena } = useAuth();
  const insets = useSafeAreaInsets();
  const [paso, setPaso] = useState<'correo' | 'codigo'>('correo');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');
  const [error, setError] = useState<ErrorAuth | null>(null);
  const [enviando, setEnviando] = useState(false);

  const pedirCodigo = async () => {
    setEnviando(true);
    const e = await enviarCodigoRecuperacion(email);
    setEnviando(false);
    setError(e);
    if (!e) setPaso('codigo');
  };

  // Si el código es correcto, Supabase abre sesión y la app entra sola al área del usuario.
  const cambiar = async () => {
    setEnviando(true);
    setError(await restablecerContrasena(email, codigo, nueva));
    setEnviando(false);
  };

  return (
    <KeyboardAvoidingView behavior="height" style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl }]} keyboardShouldPersistTaps="handled">
        <AppText variant="headline" accessibilityRole="header">
          Recupera tu contraseña
        </AppText>
        {paso === 'correo' ? (
          <>
            <AppText variant="body" color="onSurfaceVariant">
              Te enviaremos un código de 6 dígitos a tu correo.
            </AppText>
            <TextField label="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            <Button label="Enviar código" disabled={!email} loading={enviando} onPress={pedirCodigo} />
          </>
        ) : (
          <>
            <AppText variant="body" color="onSurfaceVariant">
              Revisa tu correo {email.trim()} y escribe el código junto con tu nueva contraseña.
            </AppText>
            <TextField label="Código" value={codigo} onChangeText={setCodigo} keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" />
            <PasswordField label="Nueva contraseña" value={nueva} onChangeText={setNueva} autoComplete="new-password" ayuda="Al menos 8 caracteres." />
            <Button label="Cambiar contraseña" disabled={codigo.length !== 6 || nueva.length < 8} loading={enviando} onPress={cambiar} />
            <Button label="Enviar otro código" variant="ghost" onPress={pedirCodigo} />
          </>
        )}
        {error ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            {mensajeAuth[error]}
          </AppText>
        ) : null}
        <Button label="Volver a ingresar" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.screen, gap: Spacing.md },
});
