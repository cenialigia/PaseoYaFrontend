import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/state/auth';

// CLI-04 · Foto de perfil opcional (DEC-F14-08/16): cámara o galería, vista previa en el avatar, «Quitar foto» y «Omitir».
export default function FotoPerfil() {
  const { usuario, subirAvatar, quitarAvatar, terminarFoto, pendienteFoto } = useAuth();
  const insets = useSafeAreaInsets();
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const salir = () => {
    terminarFoto();
    if (pendienteFoto) router.replace('/inicio');
    else router.back();
  };

  const elegir = async (origen: 'camara' | 'galeria') => {
    setMensaje(null);
    const permiso = origen === 'camara' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      setMensaje(origen === 'camara' ? 'Sin permiso para usar la cámara. Puedes elegir una foto de la galería.' : 'Sin permiso para ver tus fotos.');
      return;
    }
    const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true };
    const r = origen === 'camara' ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
    const foto = r.canceled ? undefined : r.assets[0];
    if (!foto?.base64) return;
    setSubiendo(true);
    const ok = await subirAvatar(foto.base64, foto.mimeType ?? 'image/jpeg');
    setSubiendo(false);
    setMensaje(ok ? 'Foto guardada.' : 'No se pudo subir la foto. Intenta de nuevo.');
  };

  const quitar = () =>
    Alert.alert('¿Quitar tu foto?', 'Se borrará de PaseoYa. Puedes subir otra cuando quieras.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          setSubiendo(true);
          const ok = await quitarAvatar();
          setSubiendo(false);
          setMensaje(ok ? 'Foto eliminada.' : 'No se pudo quitar la foto. Intenta de nuevo.');
        },
      },
    ]);

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg }]}>
      <AppText variant="headline" accessibilityRole="header">
        Agrega tu foto
      </AppText>
      <AppText variant="body" color="onSurfaceVariant" style={styles.centro}>
        Esto ayudará a personalizar tu experiencia en PaseoYa. Sólo tú puedes verla.
      </AppText>
      <Avatar tamano={160} />
      {mensaje ? (
        <AppText variant="bodySm" color={mensaje === 'Foto guardada.' || mensaje === 'Foto eliminada.' ? 'onSecondaryFixedVariant' : 'error'} accessibilityLiveRegion="polite">
          {mensaje}
        </AppText>
      ) : null}
      <View style={styles.botones}>
        <Button label="Tomar foto" loading={subiendo} onPress={() => elegir('camara')} />
        <Button label="Elegir de la galería" variant="outline" disabled={subiendo} onPress={() => elegir('galeria')} />
        {usuario?.avatarPath ? <Button label="Quitar foto" variant="ghost" disabled={subiendo} onPress={quitar} /> : null}
        <Button label={pendienteFoto ? 'Omitir por ahora' : 'Listo'} variant="ghost" disabled={subiendo} onPress={salir} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', paddingHorizontal: Spacing.screen, gap: Spacing.lg },
  centro: { textAlign: 'center' },
  botones: { alignSelf: 'stretch', gap: Spacing.sm, marginTop: 'auto' },
});
