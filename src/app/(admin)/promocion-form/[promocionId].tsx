import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useCatalogo } from '@/data';
import { guardarPromocionAdmin, listarPromocionesAdmin, type PromocionAdmin } from '@/data/admin';
import { listarProductosComercio, type ProductoComercio } from '@/data/catalogo-comercio';
import { formatFechaHora } from '@/lib/format';

const DURACIONES = [7, 15, 30] as const;

// ADM-12 · Crear o editar promoción (sólo % con vigencia, DEC-F14-11). Las del admin nacen aprobadas.
export default function PromocionForm() {
  const { promocionId } = useLocalSearchParams<{ promocionId: string }>();
  const nueva = promocionId === 'nueva';
  const { comercios, recargar } = useCatalogo();
  const [existente, setExistente] = useState<PromocionAdmin | null>(null);
  const [comercioId, setComercioId] = useState<string | null>(null);
  const [productos, setProductos] = useState<ProductoComercio[]>([]);
  const [productoId, setProductoId] = useState<string | null>(null);
  const [porcentaje, setPorcentaje] = useState('');
  const [dias, setDias] = useState<number>(7);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (nueva) return;
    let activo = true;
    listarPromocionesAdmin().then((r) => {
      const p = r?.find((x) => x.id === promocionId);
      if (!activo || !p) return;
      setExistente(p);
      setPorcentaje(String(p.porcentaje));
    });
    return () => {
      activo = false;
    };
  }, [nueva, promocionId]);

  useEffect(() => {
    if (!comercioId) return;
    let activo = true;
    listarProductosComercio(comercioId).then((r) => {
      if (activo) setProductos((r ?? []).filter((p) => p.activo));
    });
    return () => {
      activo = false;
    };
  }, [comercioId]);

  if (!nueva && !existente) return <LoadingState label="Cargando promoción" />;
  const pct = /^\d{1,2}$/.test(porcentaje) ? Number(porcentaje) : 0;
  const valido = pct >= 1 && pct <= 90 && (!nueva || !!productoId);

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    // Al editar, la vigencia se cuenta desde hoy con la duración elegida.
    const fin = new Date(Date.now() + dias * 86_400_000).toISOString();
    const ok = await guardarPromocionAdmin(existente?.id ?? null, existente?.productoId ?? productoId ?? '', pct, fin);
    setGuardando(false);
    if (!ok) return setError('No se pudo guardar la promoción. Intenta de nuevo.');
    await recargar();
    router.back();
  };

  return (
    <Screen>
      {existente ? (
        <View style={styles.bloque}>
          <AppText variant="titleSm">{existente.producto}</AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {existente.comercio} · vigente hasta el {formatFechaHora(existente.fin)}
          </AppText>
        </View>
      ) : (
        <>
          <AppText variant="label">Comercio</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {comercios
              .filter((c) => c.activo)
              .map((c) => (
                <FilterChip
                  key={c.id}
                  label={c.nombre}
                  selected={comercioId === c.id}
                  onPress={() => {
                    setComercioId(c.id);
                    setProductoId(null);
                  }}
                />
              ))}
          </ScrollView>
          {comercioId ? (
            <>
              <AppText variant="label">Producto</AppText>
              <View style={styles.chipsFila}>
                {productos.length === 0 ? (
                  <AppText variant="bodySm" color="onSurfaceVariant">
                    Este comercio no tiene productos activos.
                  </AppText>
                ) : (
                  productos.map((p) => <FilterChip key={p.id} label={p.nombre} selected={productoId === p.id} onPress={() => setProductoId(p.id)} />)
                )}
              </View>
            </>
          ) : null}
        </>
      )}
      <TextField
        label="Descuento (%)"
        value={porcentaje}
        onChangeText={(t) => setPorcentaje(t.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={2}
        error={porcentaje !== '' && !(pct >= 1 && pct <= 90) ? 'Escribe un porcentaje entre 1 y 90.' : undefined}
      />
      <AppText variant="label">{existente ? 'Nueva vigencia desde hoy' : 'Vigencia desde hoy'}</AppText>
      <View style={styles.chipsFila}>
        {DURACIONES.map((d) => (
          <FilterChip key={d} label={`${d} días`} selected={dias === d} onPress={() => setDias(d)} />
        ))}
      </View>
      <Button label={nueva ? 'Crear promoción aprobada' : 'Guardar cambios'} disabled={!valido} loading={guardando} onPress={guardar} />
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm },
  chipsFila: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  bloque: { gap: 2 },
});
