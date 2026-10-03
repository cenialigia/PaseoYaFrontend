import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing, type TypographyVariant } from '@/constants/theme';
import { formatPrice } from '@/lib/format';

type Props = { amount: number; previous?: number; variant?: TypographyVariant };

export function PriceText({ amount, previous, variant = 'titleSm' }: Props) {
  const label = previous
    ? `Precio ${formatPrice(amount)}, antes ${formatPrice(previous)}`
    : `Precio ${formatPrice(amount)}`;
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <AppText variant={variant} color="primary">
        {formatPrice(amount)}
      </AppText>
      {previous ? (
        <AppText variant="bodySm" color="onSurfaceVariant" style={styles.previous}>
          {formatPrice(previous)}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  previous: { textDecorationLine: 'line-through' },
});
