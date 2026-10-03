import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Colors, Spacing, TouchTarget } from '@/constants/theme';

// Logo de texto provisional (DEC-11) hasta que Paulo aporte uno definitivo.
export function AppHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.brandRow}>
        <View accessible accessibilityRole="header" accessibilityLabel="PaseoYA, Paseo Aranjuez">
          <AppText variant="titleSm" color="primary" style={styles.logo}>
            PaseoYA
          </AppText>
          <AppText variant="caption" color="onSurfaceVariant">
            Paseo Aranjuez
          </AppText>
        </View>
        <View style={styles.actions}>
          <Link href="/notificaciones" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Notificaciones" style={styles.action}>
              <AppText variant="labelSm" color="primary">
                Avisos
              </AppText>
            </Pressable>
          </Link>
          <Link href="/cuenta" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Mi cuenta" style={styles.action}>
              <AppText variant="labelSm" color="primary">
                Cuenta
              </AppText>
            </Pressable>
          </Link>
        </View>
      </View>
      <AppText variant="headline" accessibilityRole="header">
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontFamily: 'PlusJakartaSans_800ExtraBold' },
  actions: { flexDirection: 'row', gap: Spacing.xs },
  action: { minWidth: TouchTarget, minHeight: TouchTarget, alignItems: 'center', justifyContent: 'center' },
});
