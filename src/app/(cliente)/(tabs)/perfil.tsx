import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useAuth } from '@/state/auth';

type Opcion = { icono: keyof typeof MaterialIcons.glyphMap; texto: string; destino: Href };

// CLI-26 · Perfil. Sin direcciones ni métodos de pago (DEC-F14-05): no tienen uso sin delivery ni pago real.
const OPCIONES: Opcion[] = [
  { icono: 'person-outline', texto: 'Información personal', destino: '/datos-personales' },
  { icono: 'photo-camera', texto: 'Foto de perfil', destino: '/foto-perfil' },
  { icono: 'receipt-long', texto: 'Mis pedidos', destino: '/pedidos' },
  { icono: 'notifications-none', texto: 'Notificaciones', destino: '/notificaciones' },
  { icono: 'favorite-border', texto: 'Mis favoritos', destino: '/favoritos' },
  { icono: 'report-problem', texto: 'Reportar un problema', destino: '/reportar' },
  { icono: 'help-outline', texto: 'Ayuda y legal', destino: '/ayuda' },
];

export default function Perfil() {
  const { usuario, salir } = useAuth();

  const confirmarSalida = () =>
    Alert.alert('Cerrar sesión', '¿Quieres cerrar tu sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void salir() },
    ]);

  return (
    <Screen title="Mi perfil">
      <View style={styles.cabecera}>
        <Avatar />
        <AppText variant="title">{usuario?.nombre}</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {usuario?.email}
        </AppText>
      </View>
      <View style={styles.menu}>
        {OPCIONES.map((o) => (
          <Pressable key={o.texto} accessibilityRole="button" accessibilityLabel={o.texto} onPress={() => router.push(o.destino)} style={styles.opcion}>
            <MaterialIcons name={o.icono} size={24} color={Colors.primary} />
            <AppText variant="body" style={styles.flex}>
              {o.texto}
            </AppText>
            <MaterialIcons name="chevron-right" size={24} color={Colors.onSurfaceVariant} />
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={confirmarSalida} style={[styles.opcion, styles.salir]}>
        <MaterialIcons name="logout" size={24} color={Colors.error} />
        <AppText variant="label" color="error">
          Cerrar sesión
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecera: { alignItems: 'center', gap: Spacing.xs },
  menu: { borderRadius: Radius.card, backgroundColor: Colors.surfaceContainerLowest, overflow: 'hidden' },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: TouchTarget + 8, paddingHorizontal: Spacing.md },
  flex: { flex: 1 },
  salir: { borderRadius: Radius.card, backgroundColor: Colors.errorContainer, justifyContent: 'center' },
});
