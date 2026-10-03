import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors, FontFamily } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useCart } from '@/state/cart';

export default function TabsLayout() {
  const ahora = useNow();
  const activos = useCart().carritos.filter((c) => c.expiraEn > ahora).length;

  return (
    <NativeTabs
      backgroundColor={Colors.surfaceContainerLowest}
      indicatorColor={Colors.primaryFixed}
      labelVisibilityMode="labeled"
      badgeBackgroundColor={Colors.error}
      labelStyle={{
        default: { color: Colors.onSurfaceVariant, fontFamily: FontFamily.semiBold },
        selected: { color: Colors.primary, fontFamily: FontFamily.semiBold },
      }}>
      <NativeTabs.Trigger name="explorar" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Explorar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="storefront" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="comparar" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Comparar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="compare_arrows" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="carritos" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Carritos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="shopping_cart" />
        {activos > 0 ? <NativeTabs.Trigger.Badge>{String(activos)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pedidos" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Pedidos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="receipt_long" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
