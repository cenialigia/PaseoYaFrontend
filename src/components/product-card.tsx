import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PriceText } from '@/components/ui/price-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getComercio, type Producto } from '@/fixtures';
import { motivoNoAgregado, useCart } from '@/state/cart';

export function stockLabel(stock: number): string {
  if (stock === 0) return 'Agotado';
  if (stock <= 2) return stock === 1 ? 'Última unidad' : `Últimas ${stock} unidades`;
  return `${stock} disponibles`;
}

type Props = { producto: Producto; mostrarComercio?: boolean };

export function ProductCard({ producto, mostrarComercio = true }: Props) {
  const { agregar } = useCart();
  const comercio = getComercio(producto.comercioId);
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(null);
  const bloqueado = producto.stock === 0 || !comercio?.abierto;

  const onAgregar = () => {
    const r = agregar(producto.id, 1);
    setMensaje(r.ok ? { texto: `Agregado al carrito de ${comercio?.nombre}.`, ok: true } : { texto: motivoNoAgregado[r.reason], ok: false });
  };

  return (
    <Card
      onPress={() => router.push({ pathname: '/producto/[productoId]', params: { productoId: producto.id } })}
      accessibilityLabel={`${producto.nombre}${mostrarComercio ? `, en ${comercio?.nombre}` : ''}`}>
      <View style={styles.placeholder} />
      <AppText variant="titleSm">{producto.nombre}</AppText>
      {mostrarComercio ? (
        <AppText variant="bodySm" color="onSurfaceVariant">
          {comercio?.nombre} · {comercio?.local} · {comercio?.piso}
        </AppText>
      ) : null}
      <PriceText amount={producto.precio} previous={producto.precioAnterior} />
      <AppText variant="labelSm" color={producto.stock === 0 ? 'error' : producto.stock <= 2 ? 'onTertiaryFixedVariant' : 'secondary'}>
        {stockLabel(producto.stock)}
      </AppText>
      <Button
        label={!comercio?.abierto ? 'Comercio cerrado' : producto.stock === 0 ? 'Agotado' : `Agregar al carrito de ${comercio.nombre}`}
        variant="secondary"
        disabled={bloqueado}
        onPress={onAgregar}
      />
      {mensaje ? (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          <AppText variant="bodySm" color={mensaje.ok ? 'onSecondaryFixedVariant' : 'error'}>
            {mensaje.texto}
          </AppText>
          {mensaje.ok ? <Button label="Ver carritos" variant="ghost" onPress={() => router.navigate('/carritos')} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  // Placeholder sin marca (DEC-15); proporción 1:1 de producto reducida para listas.
  placeholder: { height: 120, borderRadius: Radius.control, backgroundColor: Colors.surfaceContainer },
  feedback: { gap: Spacing.xs },
});
