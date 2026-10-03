import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Colors, Spacing } from '@/constants/theme';
import { mensajeAuth, useAuth, type ErrorAuth } from '@/state/auth';

export default function Registro() {
  const { registrarCliente } = useAuth();
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ErrorAuth | null>(null);

  return (
    <KeyboardAvoidingView behavior="height" style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]} keyboardShouldPersistTaps="handled">
        <AppText variant="headline" accessibilityRole="header">
          Crear cuenta de cliente
        </AppText>
        <TextField label="Nombre" value={nombre} onChangeText={setNombre} autoComplete="name" />
        <TextField label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <TextField label="Contraseña (mínimo 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        {error ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            {mensajeAuth[error]}
          </AppText>
        ) : null}
        <Button label="Crear cuenta" onPress={() => setError(registrarCliente(nombre, email, password))} />
        <Button label="Ya tengo cuenta" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.screen, gap: Spacing.md },
});
