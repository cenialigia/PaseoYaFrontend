import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';

import { AppText } from '@/components/ui/app-text';
import { Colors, FontFamily, Spacing } from '@/constants/theme';
import { rutaInicial, useAuth } from '@/state/auth';

// CLI-01: splash de marca; luego bienvenida (sin sesión) o el área de cada rol.
export default function Index() {
  const { usuario, cargando, pendienteFoto, sinConexion, reintentar } = useAuth();
  const [reintentando, setReintentando] = useState(false);
  // Con sesión guardada y sin servidor no se manda a la bienvenida como si se hubiera cerrado sesión.
  if (!cargando && sinConexion && !usuario) {
    return (
      <View style={styles.splash} accessibilityLiveRegion="polite">
        <MaterialIcons name="cloud-off" size={64} color={Colors.onPrimary} />
        <AppText variant="title" color="onPrimary">
          Sin conexión
        </AppText>
        <AppText variant="body" color="onPrimary" style={styles.centro}>
          No pudimos conectar con PaseoYa. Revisa tu internet e intenta de nuevo.
        </AppText>
        <Button
          label="Reintentar"
          variant="secondary"
          loading={reintentando}
          onPress={async () => {
            setReintentando(true);
            await reintentar();
            setReintentando(false);
          }}
        />
      </View>
    );
  }
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
  centro: { textAlign: 'center', paddingHorizontal: Spacing.screen },
});
