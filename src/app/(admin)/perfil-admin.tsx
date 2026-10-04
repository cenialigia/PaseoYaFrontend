import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useAuth } from '@/state/auth';

// ADM-13 · Perfil del admin: datos de la cuenta, ayuda y cierre de sesión (sin preferencias aún no decididas).
export default function PerfilAdmin() {
  const { usuario, salir } = useAuth();

  const cerrarSesion = () =>
    Alert.alert('Cerrar sesión', '¿Quieres cerrar tu sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void salir() },
    ]);

  const opciones: { icono: keyof typeof MaterialIcons.glyphMap; texto: string; alTocar: () => void }[] = [
    { icono: 'history', texto: 'Auditoría de acciones', alTocar: () => router.push('/auditoria') },
    { icono: 'help-outline', texto: 'Ayuda y legal', alTocar: () => router.push('/ayuda-admin') },
    { icono: 'logout', texto: 'Cerrar sesión', alTocar: cerrarSesion },
  ];

  return (
    <Screen>
      <View style={styles.cabecera}>
        <View style={styles.foto}>
          <MaterialIcons name="admin-panel-settings" size={48} color={Colors.primary} />
        </View>
        <AppText variant="headline">{usuario?.nombre}</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {usuario?.email} · Administración
        </AppText>
      </View>
      <View style={styles.menu}>
        {opciones.map((o) => (
          <Pressable key={o.texto} accessibilityRole="button" accessibilityLabel={o.texto} onPress={o.alTocar} style={styles.opcion} android_ripple={{ color: Colors.surfaceContainer }}>
            <MaterialIcons name={o.icono} size={24} color={Colors.primary} />
            <AppText variant="body" style={styles.flex}>
              {o.texto}
            </AppText>
            <MaterialIcons name="chevron-right" size={24} color={Colors.outline} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecera: { alignItems: 'center', gap: Spacing.xs },
  foto: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  menu: { borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest, overflow: 'hidden' },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: TouchTarget + 8, paddingHorizontal: Spacing.md },
  flex: { flex: 1 },
});
