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
  // Área tocable de 48 dp (también para TalkBack); la pastilla visual mide 36 dp.
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} style={styles.touch}>
      <View style={[styles.filter, { backgroundColor: selected ? Colors.secondary : Colors.surfaceContainer }]}>
        <AppText variant="labelSm" color={selected ? 'onSecondary' : 'onSurfaceVariant'}>
          {label}
        </AppText>
      </View>
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
  touch: { minHeight: TouchTarget, justifyContent: 'center' },
  filter: {
    height: 36,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
});
