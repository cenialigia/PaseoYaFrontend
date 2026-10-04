import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';

type Props = { value: string; onChangeText: (t: string) => void; placeholder: string; autoFocus?: boolean };

// Buscador con icono y botón para limpiar; el placeholder indica el ámbito (global, categoría o tienda).
export function SearchField({ value, onChangeText, placeholder, autoFocus }: Props) {
  return (
    <View style={styles.caja}>
      <MaterialIcons name="search" size={22} color={Colors.onSurfaceVariant} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.onSurfaceVariant}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoFocus={autoFocus}
        style={styles.input}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => onChangeText('')} style={styles.limpiar}>
          <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: TouchTarget,
    paddingLeft: Spacing.md,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  input: { ...Typography.body, flex: 1, minHeight: TouchTarget, color: Colors.onSurface },
  limpiar: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
});
