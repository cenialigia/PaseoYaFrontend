import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';

type Props = TextInputProps & { label: string; error?: boolean | string; ayuda?: string };

export function TextField({ label, error, ayuda, style, ...rest }: Props) {
  const mensaje = typeof error === 'string' ? error : undefined;
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={mensaje ?? ayuda}
        placeholderTextColor={Colors.onSurfaceVariant}
        style={[styles.input, !!error && styles.error, style]}
        {...rest}
      />
      {mensaje ? (
        <AppText variant="bodySm" color="error">
          {mensaje}
        </AppText>
      ) : ayuda ? (
        <AppText variant="caption" color="onSurfaceVariant">
          {ayuda}
        </AppText>
      ) : null}
    </View>
  );
}

// Contraseña con botón para mostrarla u ocultarla (CLI-05).
export function PasswordField({ label, error, ayuda, ...rest }: Omit<Props, 'secureTextEntry'>) {
  const [visible, setVisible] = useState(false);
  const mensaje = typeof error === 'string' ? error : undefined;
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.input, styles.fila, !!error && styles.error]}>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={mensaje ?? ayuda}
          placeholderTextColor={Colors.onSurfaceVariant}
          secureTextEntry={!visible}
          style={styles.dentro}
          {...rest}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onPress={() => setVisible((v) => !v)}
          style={styles.ojo}>
          <MaterialIcons name={visible ? 'visibility-off' : 'visibility'} size={22} color={Colors.onSurfaceVariant} />
        </Pressable>
      </View>
      {mensaje ? (
        <AppText variant="bodySm" color="error">
          {mensaje}
        </AppText>
      ) : ayuda ? (
        <AppText variant="caption" color="onSurfaceVariant">
          {ayuda}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.xs },
  input: {
    ...Typography.body,
    minHeight: TouchTarget,
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    color: Colors.onSurface,
  },
  fila: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0, paddingLeft: Spacing.md },
  dentro: { ...Typography.body, flex: 1, minHeight: TouchTarget, color: Colors.onSurface },
  ojo: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  error: { borderColor: Colors.error },
});
