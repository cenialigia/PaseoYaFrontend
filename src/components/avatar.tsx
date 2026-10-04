import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/state/auth';

// Avatar privado: se pide una URL firmada temporal al bucket `avatares` (DEC-F14-16).
export function Avatar({ tamano = 96 }: { tamano?: number }) {
  const { usuario, urlAvatar } = useAuth();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    urlAvatar().then((u) => {
      if (activo) setUrl(u);
    });
    return () => {
      activo = false;
    };
  }, [usuario?.avatarPath, urlAvatar]);

  return (
    <View style={[styles.circulo, { width: tamano, height: tamano, borderRadius: tamano / 2 }]} accessible accessibilityLabel={url ? 'Tu foto de perfil' : 'Sin foto de perfil'}>
      {url ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <MaterialIcons name="person" size={tamano * 0.6} color={Colors.outline} />}
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: { backgroundColor: Colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
