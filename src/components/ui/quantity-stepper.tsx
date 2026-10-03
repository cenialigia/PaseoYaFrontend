import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';

type Props = { value: number; min?: number; max: number; onChange: (value: number) => void; label: string };

export function QuantityStepper({ value, min = 1, max, onChange, label }: Props) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment' && value < max) onChange(value + 1);
        if (e.nativeEvent.actionName === 'decrement' && value > min) onChange(value - 1);
      }}>
      <StepButton symbol="−" disabled={value <= min} onPress={() => onChange(value - 1)} />
      <AppText variant="title" style={styles.value}>
        {value}
      </AppText>
      <StepButton symbol="+" disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function StepButton({ symbol, disabled, onPress }: { symbol: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.button, disabled && styles.disabled]} importantForAccessibility="no">
      <AppText variant="title" color="primary">
        {symbol}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, alignSelf: 'flex-start' },
  button: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  value: { minWidth: 32, textAlign: 'center' },
});
