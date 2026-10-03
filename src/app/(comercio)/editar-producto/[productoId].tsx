import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import {
  actualizarProducto,
  crearProducto,
  leerNumero,
  mensajeGuardado,
  obtenerProductoComercio,
  type DatosProducto,
} from '@/data/catalogo-comercio';
import { useCatalogo } from '@/data/catalogo';
import { useAuth } from '@/state/auth';

type Form = { nombre: string; precio: string; precioAnterior: string; stock: string };

const vacio: Form = { nombre: '', precio: '', precioAnterior: '', stock: '0' };

// Valida en el cliente para orientar; el servidor vuelve a validar con CHECK y RLS.
function validar(f: Form): { datos?: DatosProducto; error?: string } {
  const nombre = f.nombre.trim();
  const precio = leerNumero(f.precio);
  const anterior = f.precioAnterior.trim() ? leerNumero(f.precioAnterior) : undefined;
  const stock = /^\d+$/.test(f.stock.trim()) ? Number(f.stock.trim()) : null;
  if (nombre.length < 2) return { error: 'El nombre debe tener al menos 2 caracteres.' };
  if (precio === null || precio <= 0) return { error: 'Escriba un precio mayor que cero (por ejemplo 120 o 99,50).' };
  if (anterior === null || (anterior !== undefined && anterior <= precio)) return { error: 'El precio anterior es opcional y, si lo indica, debe ser mayor que el precio actual.' };
  if (stock === null) return { error: 'El stock debe ser un número entero de 0 o más.' };
  return { datos: { nombre, precio, precioAnterior: anterior, stock } };
}

export default function EditarProducto() {
  const { productoId } = useLocalSearchParams<{ productoId: string }>();
  const nuevo = productoId === 'nuevo';
  const { usuario } = useAuth();
  const { recargar: recargarCatalogo } = useCatalogo();
  const [form, setForm] = useState<Form | null>(nuevo ? vacio : null);
  const [stockLeido, setStockLeido] = useState(0);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (nuevo) return;
    let activo = true;
    obtenerProductoComercio(productoId).then((p) => {
      if (!activo) return;
      if (!p) return setNoEncontrado(true);
      setStockLeido(p.stock);
      setForm({ nombre: p.nombre, precio: String(p.precio), precioAnterior: p.precioAnterior ? String(p.precioAnterior) : '', stock: String(p.stock) });
    });
    return () => {
      activo = false;
    };
  }, [nuevo, productoId]);

  if (noEncontrado) return <ErrorState title="Producto no encontrado" actionLabel="Volver" onAction={() => router.back()} />;
  if (!form) return <LoadingState label="Cargando producto" />;

  const cambiar = (campo: keyof Form) => (texto: string) => setForm((f) => (f ? { ...f, [campo]: texto } : f));

  const guardar = async () => {
    const v = validar(form);
    if (!v.datos) return setMensaje(v.error ?? null);
    setGuardando(true);
    setMensaje(null);
    const error = nuevo ? await crearProducto(usuario?.comercioId ?? '', v.datos) : await actualizarProducto(productoId, v.datos, stockLeido);
    if (error === 'stock-cambio') {
      const actual = await obtenerProductoComercio(productoId);
      if (actual) {
        setStockLeido(actual.stock);
        setForm((f) => (f ? { ...f, stock: String(actual.stock) } : f));
      }
    }
    setGuardando(false);
    if (error) return setMensaje(mensajeGuardado[error]);
    void recargarCatalogo();
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: nuevo ? 'Nuevo producto' : 'Editar producto' }} />
      <TextField label="Nombre" value={form.nombre} onChangeText={cambiar('nombre')} />
      <TextField label="Precio (Bs)" value={form.precio} onChangeText={cambiar('precio')} keyboardType="decimal-pad" />
      <TextField label="Precio anterior (opcional, para mostrar oferta)" value={form.precioAnterior} onChangeText={cambiar('precioAnterior')} keyboardType="decimal-pad" />
      <TextField label="Stock disponible" value={form.stock} onChangeText={cambiar('stock')} keyboardType="number-pad" />
      {mensaje ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {mensaje}
        </AppText>
      ) : null}
      <Button label={nuevo ? 'Crear producto' : 'Guardar cambios'} loading={guardando} onPress={guardar} />
      <Button label="Cancelar" variant="ghost" disabled={guardando} onPress={() => router.back()} />
      <AppText variant="caption" color="onSurfaceVariant" style={styles.nota}>
        Los productos nuevos se publican activos. Para ocultar uno sin perder su historial de pedidos, desactívelo desde el catálogo.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nota: { marginTop: Spacing.sm },
});
