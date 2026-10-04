import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors, FontFamily } from '@/constants/theme';

// DEC-F14-02: barra del PDF de administración. Avisos y perfil viven en el encabezado.
export default function AdminTabs() {
  return (
    <NativeTabs
      backgroundColor={Colors.surfaceContainerLowest}
      indicatorColor={Colors.primaryFixed}
      labelVisibilityMode="labeled"
      labelStyle={{
        default: { color: Colors.onSurfaceVariant, fontFamily: FontFamily.semiBold },
        selected: { color: Colors.primary, fontFamily: FontFamily.semiBold },
      }}>
      <NativeTabs.Trigger name="admin" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="comercios-admin" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Comercios</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="storefront" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="usuarios" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Usuarios</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pedidos-admin" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Pedidos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="receipt_long" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mas" labelVisibilityMode="labeled">
        <NativeTabs.Trigger.Label>Más</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="menu" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
