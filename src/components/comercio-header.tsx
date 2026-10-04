import { RolHeader } from '@/components/rol-header';
import { useCatalogo } from '@/data';
import { useAuth } from '@/state/auth';

// Encabezado de las pestañas del comercio: nombre y foto de la tienda.
export function ComercioHeader({ title }: { title: string }) {
  const { usuario } = useAuth();
  // Del estado del contexto (no de getComercio, que el React Compiler memoriza).
  const { comercios } = useCatalogo();
  const comercio = comercios.find((c) => c.id === usuario?.comercioId);
  return (
    <RolHeader
      title={title}
      marca={comercio?.nombre ?? 'Mi tienda'}
      marcaAccesible={`PaseoYa Comercio, ${comercio?.nombre ?? ''}`}
      icono="storefront"
      rutaAvisos="/avisos"
      rutaPerfil="/mi-comercio"
      perfilEtiqueta="Perfil de la tienda"
      imagenUrl={comercio?.imagenUrl}
    />
  );
}
