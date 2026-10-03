import { router, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { PriceText } from '@/components/ui/price-text';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { getComercio, totalLineas } from '@/fixtures';
import { useCart } from '@/state/cart';

export default function CheckoutScreen() {
  const { carritoId } = useLocalSearchParams<{ carritoId: string }>();
  const { carritos } = useCart();
  const carrito = carritos.find((c) => c.id === carritoId);
  const comercio = carrito && getComercio(carrito.comercioId);

  if (!carrito || !comercio) return <ErrorState title="Carrito no encontrado" actionLabel="Volver" onAction={() => router.back()} />;

  return (
    <Screen>
      <AppText variant="titleSm">{comercio.nombre}</AppText>
      <AppText variant="bodySm" color="onSurfaceVariant">
        Retiro en {comercio.local} · {comercio.piso}
      </AppText>
      <PriceText amount={totalLineas(carrito.lineas)} variant="title" />
      <EmptyState title="Confirmación en preparación" message="La elección entre QR de pago (simulado) y efectivo llega en LUI-05." />
    </Screen>
  );
}
