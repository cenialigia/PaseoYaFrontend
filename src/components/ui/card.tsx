import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Elevation, Radius, Spacing } from '@/constants/theme';

type CardProps = ViewProps & { onPress?: () => void; accessibilityLabel?: string };

export function Card({ onPress, style, children, accessibilityLabel, ...rest }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        android_ripple={{ color: Colors.surfaceContainer }}
        style={[styles.card, style]}>
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[styles.card, style]} accessibilityLabel={accessibilityLabel} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerLow,
    padding: Spacing.md,
    gap: Spacing.sm,
    overflow: 'hidden',
    ...Elevation.card,
  },
});
