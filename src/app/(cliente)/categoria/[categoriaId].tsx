import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { TiendaCard } from '@/components/tienda-card';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { useCatalogo } from '@/data';
import { normalizeSearch } from '@/lib/format';

// CLI-07 · Categoría → tiendas, con buscador limitado a esa categoría (tiendas y sus productos).
export default function CategoriaScreen() {
  const { categoriaId } = useLocalSearchParams<{ categoriaId: string }>();
  const { categorias, comercios, productos } = useCatalogo();
  const [consulta, setConsulta] = useState('');
  const categoria = categorias.find((c) => c.id === categoriaId);

  if (!categoria) return <ErrorState title="Categoría no encontrada" actionLabel="Volver" onAction={() => router.back()} />;

  const termino = normalizeSearch(consulta);
  const tiendas = comercios
    .filter((c) => c.categoriaId === categoria.id)
    .filter(
      (c) =>
        !termino ||
        normalizeSearch(c.nombre).includes(termino) ||
        productos.some((p) => p.comercioId === c.id && normalizeSearch(p.nombre).includes(termino)),
    );

  return (
    <Screen>
      <Stack.Screen options={{ title: categoria.nombre }} />
      <SearchField value={consulta} onChangeText={setConsulta} placeholder={`Buscar en ${categoria.nombre}`} />
      {tiendas.length === 0 ? (
        <EmptyState title={termino ? 'Sin resultados' : 'Aún no hay tiendas aquí'} message={termino ? 'Prueba con otro nombre.' : undefined} />
      ) : (
        tiendas.map((c) => <TiendaCard key={c.id} comercio={c} />)
      )}
    </Screen>
  );
}
