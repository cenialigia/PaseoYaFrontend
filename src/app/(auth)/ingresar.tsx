import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Colors, FontFamily, Spacing } from '@/constants/theme';
import { mensajeAuth, useAuth, type ErrorAuth } from '@/state/auth';

export default function Ingresar() {
  const { ingresar } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ErrorAuth | null>(null);

  const onIngresar = () => {
    const e = ingresar(email, password);
    setError(e);
  };

  return (
    <KeyboardAvoidingView behavior="height" style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl }]} keyboardShouldPersistTaps="handled">
        <AppText variant="display" color="primary" style={styles.logo}>
          PaseoYA
        </AppText>
        <AppText variant="body" color="onSurfaceVariant">
          Compre en las tiendas de Paseo Aranjuez y retire en persona.
        </AppText>
        <View style={styles.form}>
          <TextField label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={!!error} />
          <TextField label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" error={!!error} />
          {error ? (
            <AppText variant="bodySm" color="error" accessibilityRole="alert">
              {mensajeAuth[error]}
            </AppText>
          ) : null}
          <Button label="Ingresar" disabled={!email || !password} onPress={onIngresar} />
          <Button label="Crear cuenta de cliente" variant="ghost" onPress={() => router.push('/registro')} />
        </View>
        <AppText variant="caption" color="onSurfaceVariant">
          Las cuentas de comercio las crea la administración de Paseo Aranjuez.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.screen, gap: Spacing.md },
  logo: { fontFamily: FontFamily.extraBold },
  form: { gap: Spacing.md, marginTop: Spacing.lg },
});
