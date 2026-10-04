import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors, FontFamily } from '@/constants/theme';

// DEC-F14-02: barra del PDF de comercio. Avisos y perfil viven en el encabezado.
export default function ComercioTabs() {
  return (
    <NativeTabs
      backgroundColor={Colors.surfaceContainerLowest}
      indicatorColor={Colors.primaryFixed}
      labelVisibilityMode="labeled"
      labelStyle={{
        default: { color: Colors.onSurfaceVariant, fontFamily: FontFamily.semiBold },
        selected: { color: Colors.primary, fontFamily: FontFamily.semiBold },
      }}>
      <NativeTabs.Trigger name="panel" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ordenes" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Pedidos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="receipt_long" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="catalogo" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Productos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="inventory_2" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ventas" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Ventas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="bar_chart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
