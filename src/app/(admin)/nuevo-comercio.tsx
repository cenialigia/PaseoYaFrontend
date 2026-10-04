import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { PasswordField, TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { crearComercio } from '@/data/admin';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// DEC-F14-06 · Alta de comercio con su cuenta única: el servidor crea el comercio (cerrado) y la cuenta COMERCIO enlazada.
export default function NuevoComercio() {
  const { categorias, recargar } = useCatalogo();
  const [f, setF] = useState({ nombre: '', categoriaId: '', piso: '', local: '', email: '', password: '' });
  const [enviado, setEnviado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<string | null>(null);
  const cambiar = (k: keyof typeof f) => (t: string) => setF((x) => ({ ...x, [k]: t }));

  const errores = {
    nombre: f.nombre.trim().length < 2 ? 'Escribe el nombre del comercio.' : undefined,
    categoriaId: !f.categoriaId ? 'Elige una categoría.' : undefined,
    piso: !f.piso.trim() ? 'Indica el piso.' : undefined,
    local: !f.local.trim() ? 'Indica el local.' : undefined,
    email: !EMAIL.test(f.email.trim()) ? 'Escribe un correo válido.' : undefined,
    password: f.password.length < 8 ? 'Al menos 8 caracteres.' : undefined,
  };
  const valido = Object.values(errores).every((e) => !e);

  const crear = async () => {
    setEnviado(true);
    if (!valido) return;
    setGuardando(true);
    setError(null);
    const r = await crearComercio({ ...f, email: f.email.trim().toLowerCase() });
    setGuardando(false);
    if (r === 'email-en-uso') return setError('Ya existe una cuenta con ese correo.');
    if (r === 'datos') return setError('El servidor rechazó los datos. Revisa el correo y la contraseña.');
    if (r === 'red') return setError('No se pudo crear el comercio. Intenta de nuevo.');
    await recargar();
    setCreado(r);
  };

  if (creado) {
    return (
      <Screen>
        <AppText variant="headline">Comercio creado</AppText>
        <AppText variant="body" color="onSurfaceVariant">
          {f.nombre.trim()} ya tiene su cuenta ({f.email.trim().toLowerCase()}). Comparte el correo y la contraseña inicial con el comercio por un canal seguro. La tienda
          empieza cerrada: el comercio la abre desde su app cuando cargue sus productos.
        </AppText>
        <Button label="Ver comercio" onPress={() => router.replace({ pathname: '/comercio-admin/[comercioId]', params: { comercioId: creado } })} />
        <Button label="Volver a comercios" variant="outline" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <TextField label="Nombre del comercio" value={f.nombre} onChangeText={cambiar('nombre')} error={enviado && errores.nombre} />
      <AppText variant="label">Categoría</AppText>
      <View style={styles.chips}>
        {categorias.map((k) => (
          <FilterChip key={k.id} label={k.nombre} selected={f.categoriaId === k.id} onPress={() => setF((x) => ({ ...x, categoriaId: k.id }))} />
        ))}
      </View>
      {enviado && errores.categoriaId ? (
        <AppText variant="bodySm" color="error">
          {errores.categoriaId}
        </AppText>
      ) : null}
      <View style={styles.fila}>
        <View style={styles.flex}>
          <TextField label="Piso" value={f.piso} onChangeText={cambiar('piso')} placeholder="Piso 1" error={enviado && errores.piso} />
        </View>
        <View style={styles.flex}>
          <TextField label="Local" value={f.local} onChangeText={cambiar('local')} placeholder="Local 140" error={enviado && errores.local} />
        </View>
      </View>
      <AppText variant="title">Cuenta del comercio</AppText>
      <TextField
        label="Correo"
        value={f.email}
        onChangeText={cambiar('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="off"
        error={enviado && errores.email}
      />
      <PasswordField label="Contraseña inicial" value={f.password} onChangeText={cambiar('password')} error={enviado && errores.password} />
      <Button label="Crear comercio" loading={guardando} onPress={crear} />
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  fila: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
});
