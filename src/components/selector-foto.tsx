import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { elegirFoto, subirImagen, urlImagen } from '@/lib/imagenes';

type Props = { etiqueta: string; carpeta: string; path?: string; onChange: (path: string | undefined) => void };

// Foto de producto o tienda (DEC-F14-16): se sube al elegirla a imagenes/<comercio>/ y el formulario guarda la ruta.
export function SelectorFoto({ etiqueta, carpeta, path, onChange }: Props) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = urlImagen(path);

  const elegir = async (origen: 'camara' | 'galeria') => {
    setError(null);
    const foto = await elegirFoto(origen);
    if (foto === 'sin-permiso') return setError(origen === 'camara' ? 'Sin permiso para usar la cámara. Puedes elegir una foto de la galería.' : 'Sin permiso para ver tus fotos.');
    if (!foto) return;
    setSubiendo(true);
    const ruta = await subirImagen(carpeta, foto.base64, foto.mime);
    setSubiendo(false);
    if (ruta) onChange(ruta);
    else setError('No se pudo subir la foto. Intenta de nuevo.');
  };

  return (
    <View style={styles.contenedor}>
      <AppText variant="label">{etiqueta}</AppText>
      <View style={styles.vista} accessible accessibilityLabel={url ? `${etiqueta}: con foto` : `${etiqueta}: sin foto`}>
        {url ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <MaterialIcons name="add-a-photo" size={40} color={Colors.outline} />}
      </View>
      <View style={styles.botones}>
        <Button label="Tomar foto" variant="outline" loading={subiendo} onPress={() => elegir('camara')} />
        <Button label="Galería" variant="outline" disabled={subiendo} onPress={() => elegir('galeria')} />
        {url ? <Button label="Quitar" variant="ghost" disabled={subiendo} onPress={() => onChange(undefined)} /> : null}
      </View>
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: Spacing.sm },
  vista: { aspectRatio: 4 / 3, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  botones: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
