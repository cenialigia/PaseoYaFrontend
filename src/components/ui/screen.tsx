import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { AppHeader } from '@/components/ui/app-header';
import { Colors, Spacing } from '@/constants/theme';

type Props = { title?: string; children: ReactNode };

// Con `title` dibuja el encabezado de marca (pestañas); sin él, la pantalla usa el header nativo de la pila.
export function Screen({ title, children }: Props) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} stickyHeaderIndices={title ? [0] : undefined}>
      {title ? <AppHeader title={title} /> : null}
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingBottom: Spacing.xl },
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.md, gap: Spacing.lg },
  section: { gap: Spacing.gutter },
});
