import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, FontFamily, Spacing } from '@/constants/theme';
import { rutaInicial, useAuth } from '@/state/auth';

// CLI-01: splash de marca; luego bienvenida (sin sesión) o el área de cada rol.
export default function Index() {
  const { usuario, cargando, pendienteFoto } = useAuth();
  if (!cargando) return <Redirect href={usuario ? rutaInicial(usuario.rol, pendienteFoto) : '/bienvenida'} />;
  return (
    <View style={styles.splash} accessible accessibilityLabel="PaseoYa, Paseo inteligente en tus manos. Cargando">
      <MaterialIcons name="shopping-bag" size={72} color={Colors.onPrimary} />
      <AppText variant="display" color="onPrimary" style={styles.marca}>
        PaseoYa
      </AppText>
      <AppText variant="body" color="onPrimary">
        Paseo inteligente en tus manos
      </AppText>
      <ActivityIndicator color={Colors.onPrimary} style={styles.carga} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  marca: { fontFamily: FontFamily.extraBold },
  carga: { marginTop: Spacing.lg },
});
