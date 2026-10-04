import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors, FontFamily } from '@/constants/theme';

// DEC-F14-02: barra del PDF. Carrito, favoritos y avisos viven en el encabezado.
export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={Colors.surfaceContainerLowest}
      indicatorColor={Colors.primaryFixed}
      labelVisibilityMode="labeled"
      labelStyle={{
        default: { color: Colors.onSurfaceVariant, fontFamily: FontFamily.semiBold },
        selected: { color: Colors.primary, fontFamily: FontFamily.semiBold },
      }}>
      <NativeTabs.Trigger name="inicio" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pedidos" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Mis pedidos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="receipt_long" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="promociones" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Promociones</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="local_offer" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
