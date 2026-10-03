import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ButtonHeight, Colors, Radius, Spacing, type ColorToken } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

const palette: Record<Variant, { bg: string; fg: ColorToken; border?: string }> = {
  primary: { bg: Colors.primary, fg: 'onPrimary' },
  secondary: { bg: Colors.secondary, fg: 'onSecondary' },
  outline: { bg: 'transparent', fg: 'primary', border: Colors.outline },
  ghost: { bg: 'transparent', fg: 'primary' },
  destructive: { bg: Colors.error, fg: 'onError' },
};

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loading = false, disabled, style, ...rest }: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      // Bloquea el doble toque mientras una acción con efecto está en curso.
      disabled={inactive}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      style={(state) => [
        styles.base,
        { backgroundColor: p.bg, borderColor: p.border ?? 'transparent', opacity: inactive ? 0.5 : 1 },
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <View style={styles.content}>
        {loading && <ActivityIndicator color={Colors[p.fg]} />}
        <AppText variant="label" color={p.fg}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: ButtonHeight,
    borderRadius: Radius.control,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: { transform: [{ scale: 0.98 }] },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
});
