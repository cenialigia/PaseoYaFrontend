import * as ImagePicker from 'expo-image-picker';

import { base64ABytes } from '@/lib/format';
import { supabase } from '@/lib/supabase';

// Bucket público `imagenes` (DEC-F14-16): cada comercio escribe sólo en su carpeta <comercio_id>/.
export function urlImagen(path: string | null | undefined): string | undefined {
  return path ? supabase.storage.from('imagenes').getPublicUrl(path).data.publicUrl : undefined;
}

// Se sube desde base64 porque fetch(uri) no lee bien archivos locales en React Native.
export async function subirImagen(carpeta: string, base64: string, mime: string): Promise<string | null> {
  try {
    const datos = base64ABytes(base64);
    if (datos.length < 100) return null;
    const ruta = `${carpeta}/${Date.now()}.${mime === 'image/png' ? 'png' : 'jpg'}`;
    const { error } = await supabase.storage.from('imagenes').upload(ruta, datos, { contentType: mime, upsert: false });
    return error ? null : ruta;
  } catch {
    return null;
  }
}

export type FotoElegida = { base64: string; mime: string };

// Cámara o galería con recorte; null si se cancela, 'sin-permiso' si se negó el acceso.
export async function elegirFoto(origen: 'camara' | 'galeria', aspecto: [number, number] = [4, 3]): Promise<FotoElegida | 'sin-permiso' | null> {
  const permiso = origen === 'camara' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) return 'sin-permiso';
  const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: aspecto, quality: 0.7, base64: true };
  const r = origen === 'camara' ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
  const foto = r.canceled ? undefined : r.assets[0];
  return foto?.base64 ? { base64: foto.base64, mime: foto.mimeType ?? 'image/jpeg' } : null;
}
