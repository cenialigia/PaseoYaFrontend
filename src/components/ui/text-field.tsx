import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';

type Props = TextInputProps & { label: string; error?: boolean };

export function TextField({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={Colors.onSurfaceVariant}
        style={[styles.input, error && styles.error, style]}
        {...rest}
      />
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
  error: { borderColor: Colors.error },
});
