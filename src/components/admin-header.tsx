import { RolHeader } from '@/components/rol-header';

// Encabezado de las pestañas del admin (PDF ADM): avisos y perfil fuera de la barra.
export function AdminHeader({ title }: { title: string }) {
  return (
    <RolHeader
      title={title}
      marca="PaseoYa Admin"
      marcaAccesible="PaseoYa, administración de Paseo Aranjuez"
      icono="admin-panel-settings"
      rutaAvisos="/avisos-admin"
      rutaPerfil="/perfil-admin"
      perfilEtiqueta="Mi perfil"
    />
  );
}
