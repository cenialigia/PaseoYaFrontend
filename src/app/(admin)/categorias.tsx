import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { listarCategoriasAdmin, type CategoriaAdmin } from '@/data/admin';

// ADM-09 · Categorías (incluidas las inactivas) con el número de comercios de cada una.
export default function CategoriasAdmin() {
  const { comercios } = useCatalogo();
  const [lista, setLista] = useState<CategoriaAdmin[] | null>(null);
  const [error, setError] = useState(false);

  const cargar = useCallback(() => {
    let activo = true;
    listarCategoriasAdmin().then((r) => {
      if (!activo) return;
      setError(r === null);
      if (r) setLista(r);
    });
    return () => {
      activo = false;
    };
  }, []);
  useFocusEffect(cargar);

  if (error && !lista) return <ErrorState title="No se pudieron cargar las categorías" onAction={cargar} />;
  if (!lista) return <LoadingState label="Cargando categorías" />;

  return (
    <Screen>
      <Button label="Nueva categoría" onPress={() => router.push({ pathname: '/categoria-form/[categoriaId]', params: { categoriaId: 'nueva' } })} />
      {lista.length === 0 ? (
        <EmptyState title="Sin categorías" />
      ) : (
        lista.map((k) => {
          const n = comercios.filter((c) => c.categoriaId === k.id).length;
          return (
            <Card
              key={k.id}
              onPress={() => router.push({ pathname: '/categoria-form/[categoriaId]', params: { categoriaId: k.id } })}
              accessibilityLabel={`${k.nombre}, ${k.activa ? 'activa' : 'inactiva'}, ${n} comercios. Editar`}>
              <View style={styles.fila}>
                <View style={styles.icono}>
                  <MaterialIcons name={k.icono as keyof typeof MaterialIcons.glyphMap} size={24} color={Colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="titleSm">{k.nombre}</AppText>
                  <AppText variant="caption" color="onSurfaceVariant">
                    {n} {n === 1 ? 'comercio' : 'comercios'} · orden {k.orden}
                  </AppText>
                </View>
                <StatusChip label={k.activa ? 'Activa' : 'Inactiva'} tone={k.activa ? 'listo' : 'entregado'} />
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  icono: { width: 44, height: 44, borderRadius: Radius.control, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
});
