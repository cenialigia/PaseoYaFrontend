import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/state/auth';

// DEC-24 · Eliminar la cuenta: se borran los datos personales y la foto; los pedidos quedan anónimos para las estadísticas de la plaza.
export default function EliminarCuenta() {
  const { eliminarCuenta } = useAuth();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmar = () =>
    Alert.alert('¿Eliminar tu cuenta?', 'No se puede deshacer. Tendrás que crear una cuenta nueva para volver a comprar.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setOcupado(true);
          setError(null);
          const r = await eliminarCuenta();
          setOcupado(false);
          // Con 'ok' se cierra la sesión y la app vuelve sola a la bienvenida.
          if (r === 'pedidos-activos') setError('Tienes pedidos en curso. Retíralos o cancélalos antes de eliminar tu cuenta.');
          if (r === 'red') setError('No se pudo eliminar la cuenta. Intenta de nuevo.');
        },
      },
    ]);

  return (
    <Screen>
      <Card>
        <AppText variant="label">Se borra</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          Tu nombre, correo, teléfono, género, fecha de nacimiento, foto, favoritos y avisos. No podrás volver a entrar con esta cuenta.
        </AppText>
      </Card>
      <Card>
        <AppText variant="label">Se conserva sin tus datos</AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          Tus pedidos, como «Cliente eliminado», para las ventas de las tiendas y las estadísticas de Paseo Aranjuez. Los reportes que enviaste se borran a los 12 meses.
        </AppText>
      </Card>
      <View style={styles.acciones}>
        <Button label="Eliminar mi cuenta" variant="destructive" loading={ocupado} onPress={confirmar} />
      </View>
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  acciones: { marginTop: Spacing.sm },
});
