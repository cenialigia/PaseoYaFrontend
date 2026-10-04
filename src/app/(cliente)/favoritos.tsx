import { router } from 'expo-router';
import { useState } from 'react';

import { ProductCard } from '@/components/product-card';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState } from '@/components/ui/state-views';
import { useCatalogo } from '@/data';
import { normalizeSearch } from '@/lib/format';
import { useFavoritos } from '@/state/favoritos';

// CLI-24 · Mis favoritos. Un producto desactivado por su tienda deja de mostrarse (no está en el catálogo).
export default function Favoritos() {
  const { productos } = useCatalogo();
  const { ids } = useFavoritos();
  const [consulta, setConsulta] = useState('');
  const termino = normalizeSearch(consulta);
  const lista = productos.filter((p) => ids.has(p.id) && (!termino || normalizeSearch(p.nombre).includes(termino)));

  return (
    <Screen>
      {ids.size > 0 ? <SearchField value={consulta} onChangeText={setConsulta} placeholder="Buscar en mis favoritos" /> : null}
      {lista.length === 0 ? (
        <EmptyState
          title={termino ? 'Sin resultados' : 'Aún no tienes favoritos'}
          message={termino ? undefined : 'Toca el corazón de un producto para guardarlo aquí.'}
          actionLabel={termino ? undefined : 'Explorar productos'}
          onAction={termino ? undefined : () => router.navigate('/inicio')}
        />
      ) : (
        lista.map((p) => <ProductCard key={p.id} producto={p} />)
      )}
    </Screen>
  );
}
