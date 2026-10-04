import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { StatusChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { useAuth } from '@/state/auth';

type Opcion = { icono: keyof typeof MaterialIcons.glyphMap; texto: string; alTocar: () => void };

// COM-13 · Perfil y configuración de la tienda (fuera de la barra). Sin «Métodos de pago» (DEC-F14-05).
export default function MiComercio() {
  const { usuario, salir } = useAuth();
  // Del estado del contexto (no de getComercio, que el React Compiler memoriza): tras editar el local se ve el dato nuevo.
  const { comercios } = useCatalogo();
  const comercio = comercios.find((c) => c.id === usuario?.comercioId);

  const cerrarSesion = () =>
    Alert.alert('Cerrar sesión', '¿Quieres cerrar tu sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void salir() },
    ]);

  const opciones: Opcion[] = [
    { icono: 'edit', texto: 'Editar establecimiento', alTocar: () => router.push('/editar-comercio') },
    { icono: 'local-offer', texto: 'Mis promociones', alTocar: () => router.push('/promociones-comercio') },
    { icono: 'notifications-none', texto: 'Avisos', alTocar: () => router.push('/avisos') },
    { icono: 'help-outline', texto: 'Ayuda y legal', alTocar: () => router.push('/ayuda-comercio') },
    { icono: 'logout', texto: 'Cerrar sesión', alTocar: cerrarSesion },
  ];

  return (
    <Screen>
      <View style={styles.cabecera}>
        <View style={styles.foto}>
          {comercio?.imagenUrl ? (
            <Image source={{ uri: comercio.imagenUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Foto de ${comercio.nombre}`} />
          ) : (
            <MaterialIcons name="storefront" size={48} color={Colors.primary} />
          )}
        </View>
        <AppText variant="headline">{comercio?.nombre}</AppText>
        <StatusChip label={comercio?.abierto ? 'Abierta' : 'Cerrada'} tone={comercio?.abierto ? 'listo' : 'cerrado'} />
        <AppText variant="bodySm" color="onSurfaceVariant">
          {comercio?.categoria} · {comercio?.piso} · {comercio?.local}
        </AppText>
        {comercio?.horario ? (
          <AppText variant="bodySm" color="onSurfaceVariant">
            {comercio.horario}
          </AppText>
        ) : null}
        <AppText variant="caption" color="onSurfaceVariant">
          {usuario?.email}
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
  foto: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  menu: { borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest, overflow: 'hidden' },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: TouchTarget + 8, paddingHorizontal: Spacing.md },
  flex: { flex: 1 },
});
