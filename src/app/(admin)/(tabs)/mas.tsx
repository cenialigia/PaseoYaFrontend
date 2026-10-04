import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AdminHeader } from '@/components/admin-header';
import { AppText } from '@/components/ui/app-text';
import { Screen, Section } from '@/components/ui/screen';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { listarPromocionesAdmin } from '@/data/admin';
import { useOrders } from '@/state/orders';

type Opcion = { icono: keyof typeof MaterialIcons.glyphMap; texto: string; destino: Href; contador?: number };

// PDF ADM · «Más»: analítica y administración (categorías, promociones, reportes y auditoría).
export default function MasAdmin() {
  const { reportes } = useOrders();
  const [porRevisar, setPorRevisar] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      listarPromocionesAdmin().then((p) => {
        if (activo) setPorRevisar(p ? p.filter((x) => x.estado === 'PENDIENTE').length : 0);
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  const grupo = (titulo: string, opciones: Opcion[]) => (
    <Section title={titulo}>
      <View style={styles.menu}>
        {opciones.map((o) => (
          <Pressable
            key={o.texto}
            accessibilityRole="button"
            accessibilityLabel={o.contador ? `${o.texto}, ${o.contador} pendientes` : o.texto}
            onPress={() => router.push(o.destino)}
            style={styles.opcion}
            android_ripple={{ color: Colors.surfaceContainer }}>
            <MaterialIcons name={o.icono} size={24} color={Colors.primary} />
            <AppText variant="body" style={styles.flex}>
              {o.texto}
            </AppText>
            {o.contador ? (
              <View style={styles.badge}>
                <AppText variant="overline" color="onError">
                  {o.contador}
                </AppText>
              </View>
            ) : null}
            <MaterialIcons name="chevron-right" size={24} color={Colors.outline} />
          </Pressable>
        ))}
      </View>
    </Section>
  );

  return (
    <Screen header={<AdminHeader title="Más" />}>
      {grupo('Analítica', [{ icono: 'insights', texto: 'Resumen, ventas y clientes', destino: '/analitica' }])}
      {grupo('Administración', [
        { icono: 'category', texto: 'Categorías', destino: '/categorias' },
        { icono: 'local-offer', texto: 'Promociones', destino: '/promociones-admin', contador: porRevisar },
        { icono: 'report-problem', texto: 'Reportes de clientes', destino: '/reportes', contador: reportes.length },
        { icono: 'history', texto: 'Auditoría de acciones', destino: '/auditoria' },
      ])}
      {grupo('Cuenta', [{ icono: 'person', texto: 'Mi perfil', destino: '/perfil-admin' }])}
    </Screen>
  );
}

const styles = StyleSheet.create({
  menu: { borderRadius: Radius.control, backgroundColor: Colors.surfaceContainerLowest, overflow: 'hidden' },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: TouchTarget + 8, paddingHorizontal: Spacing.md },
  flex: { flex: 1 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center' },
});
