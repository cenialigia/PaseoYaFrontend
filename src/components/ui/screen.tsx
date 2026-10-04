import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { AppHeader } from '@/components/ui/app-header';
import { Colors, Spacing } from '@/constants/theme';

type Props = { title?: string; header?: ReactNode; children: ReactNode };

// Con `title` dibuja el encabezado de marca del cliente y con `header` uno propio (pestañas); sin ellos, la pantalla usa el header nativo de la pila.
export function Screen({ title, header, children }: Props) {
  const cabecera = header ?? (title ? <AppHeader title={title} /> : null);
  return (
    // keyboardShouldPersistTaps: con el teclado abierto, el primer toque en un botón debe ejecutarlo, no sólo cerrar el teclado.
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      stickyHeaderIndices={cabecera ? [0] : undefined}
      keyboardShouldPersistTaps="handled">
      {cabecera}
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
