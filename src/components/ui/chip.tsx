import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Radius, Spacing, StatusColors, TouchTarget, type StatusTone } from '@/constants/theme';

export function StatusChip({ label, tone }: { label: string; tone: StatusTone }) {
  const c = StatusColors[tone];
  return (
    <View style={[styles.status, { backgroundColor: c.bg }]} accessibilityLabel={`Estado: ${label}`}>
      <AppText variant="labelSm" style={{ color: c.fg }}>
        {label}
      </AppText>
    </View>
  );
}

export function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={(TouchTarget - 36) / 2}
      style={[styles.filter, { backgroundColor: selected ? Colors.secondary : Colors.surfaceContainer }]}>
      <AppText variant="labelSm" color={selected ? 'onSecondary' : 'onSurfaceVariant'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  status: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
  },
  filter: {
    height: 36,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
});
