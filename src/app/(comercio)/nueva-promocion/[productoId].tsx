import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { aplicarDescuento } from '@/data/catalogo';
import { crearPromocion, obtenerProductoComercio, type ProductoComercio } from '@/data/catalogo-comercio';
import { formatPrice } from '@/lib/format';

const DURACIONES = [7, 15, 30] as const;

// DEC-F14-11 · Promoción de un producto: sólo % de descuento con vigencia; queda «En revisión» hasta que el admin la apruebe.
export default function NuevaPromocion() {
  const { productoId } = useLocalSearchParams<{ productoId: string }>();
  const [producto, setProducto] = useState<ProductoComercio | null>(null);
  const [porcentaje, setPorcentaje] = useState('');
  const [dias, setDias] = useState<number>(7);
  const [estado, setEstado] = useState<'enviada' | 'error' | null>(null);
  const [enviando, setEnviando] = useState(false);
  const pct = /^\d{1,2}$/.test(porcentaje) ? Number(porcentaje) : 0;
  const valido = pct >= 1 && pct <= 90;

  useEffect(() => {
    let activo = true;
    obtenerProductoComercio(productoId).then((p) => {
      if (activo) setProducto(p);
    });
    return () => {
      activo = false;
    };
  }, [productoId]);

  const enviar = async () => {
    setEnviando(true);
    const ok = await crearPromocion(productoId, pct, dias);
    setEnviando(false);
    setEstado(ok ? 'enviada' : 'error');
  };

  if (estado === 'enviada') {
    return (
      <Screen>
        <AppText variant="headline">Promoción enviada</AppText>
        <AppText variant="body" color="onSurfaceVariant">
          La administración de Paseo Aranjuez la revisará. Los clientes la verán cuando esté aprobada.
        </AppText>
        <Button label="Ver mis promociones" onPress={() => router.replace('/promociones-comercio')} />
        <Button label="Volver al producto" variant="outline" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="titleSm">{producto?.nombre ?? 'Producto'}</AppText>
      <TextField
        label="Descuento (%)"
        value={porcentaje}
        onChangeText={(t) => setPorcentaje(t.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={2}
        error={porcentaje !== '' && !valido ? 'Escribe un porcentaje entre 1 y 90.' : undefined}
      />
      {valido && producto ? (
        <AppText variant="bodySm" color="onSurfaceVariant">
          Precio con descuento: {formatPrice(aplicarDescuento(producto.precio, pct))} (hoy {formatPrice(producto.precio)}). El servidor lo calcula al confirmar cada
          pedido.
        </AppText>
      ) : null}
      <AppText variant="label">Vigencia desde hoy</AppText>
      <View style={styles.chips}>
        {DURACIONES.map((d) => (
          <FilterChip key={d} label={`${d} días`} selected={dias === d} onPress={() => setDias(d)} />
        ))}
      </View>
      <Button label="Enviar a revisión" disabled={!valido} loading={enviando} onPress={enviar} />
      {estado === 'error' ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          No se pudo crear la promoción. Intenta de nuevo.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
