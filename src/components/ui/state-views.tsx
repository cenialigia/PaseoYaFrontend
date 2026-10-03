import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors, Radius, Spacing } from '@/constants/theme';

type MessageProps = { title: string; message?: string; actionLabel?: string; onAction?: () => void };

export function EmptyState({ title, message, actionLabel, onAction }: MessageProps) {
  return (
    <View style={styles.center} accessibilityRole="summary">
      <AppText variant="titleSm" style={styles.text}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="bodySm" color="onSurfaceVariant" style={styles.text}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} variant="outline" onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorState({ title = 'No se pudo cargar', message, actionLabel = 'Reintentar', onAction }: Partial<MessageProps>) {
  return (
    <View style={styles.center} accessibilityRole="alert">
      <AppText variant="titleSm" color="error" style={styles.text}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="bodySm" color="onSurfaceVariant" style={styles.text}>
          {message}
        </AppText>
      ) : null}
      {onAction ? <Button label={actionLabel} variant="outline" onPress={onAction} /> : null}
    </View>
  );
}

export function LoadingState({ label = 'Cargando' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

export function OfflineBanner() {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <AppText variant="bodySm" color="onErrorContainer">
        Sin conexión. La información puede no estar actualizada.
      </AppText>
    </View>
  );
}

export function Skeleton({ height = 96 }: { height?: number }) {
  return <View style={[styles.skeleton, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  text: { textAlign: 'center' },
  banner: { backgroundColor: Colors.errorContainer, padding: Spacing.sm, paddingHorizontal: Spacing.screen },
  skeleton: { backgroundColor: Colors.surfaceContainer, borderRadius: Radius.card },
});
