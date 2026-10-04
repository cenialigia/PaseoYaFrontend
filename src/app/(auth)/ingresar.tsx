import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PasswordField, TextField } from '@/components/ui/text-field';
import { Colors, Spacing } from '@/constants/theme';
import { mensajeAuth, useAuth, type ErrorAuth } from '@/state/auth';

// CLI-05 · Login. Sin Google ni Apple (DEC-F14-09); el error conserva lo escrito.
export default function Ingresar() {
  const { ingresar } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ErrorAuth | null>(null);
  const [enviando, setEnviando] = useState(false);

  const onIngresar = async () => {
    setEnviando(true);
    setError(await ingresar(email, password));
    setEnviando(false);
  };

  return (
    <KeyboardAvoidingView behavior="height" style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl }]} keyboardShouldPersistTaps="handled">
        <AppText variant="headline" accessibilityRole="header">
          ¡Bienvenido de nuevo!
        </AppText>
        <AppText variant="body" color="onSurfaceVariant">
          Ingresa a tu cuenta
        </AppText>
        <TextField label="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={!!error} />
        <PasswordField label="Contraseña" value={password} onChangeText={setPassword} autoComplete="password" error={!!error} />
        <Button label="¿Olvidaste tu contraseña?" variant="ghost" onPress={() => router.push('/recuperar')} />
        {error ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            {mensajeAuth[error]}
          </AppText>
        ) : null}
        <Button label="Ingresar" disabled={!email || !password} loading={enviando} onPress={onIngresar} />
        <Button label="Crear una cuenta" variant="ghost" onPress={() => router.replace('/registro')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.screen, gap: Spacing.md },
});
