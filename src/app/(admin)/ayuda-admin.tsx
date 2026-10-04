import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen, Section } from '@/components/ui/screen';

const PREGUNTAS = [
  ['¿Cómo doy de alta un comercio?', 'En Comercios toca «Nuevo comercio». Se crea con su cuenta y empieza cerrado; comparte el correo y la contraseña inicial con el comercio por un canal seguro.'],
  ['¿Puedo cambiar precios o stock?', 'No. Esos datos son del comercio. Tú sólo activas o desactivas productos.'],
  ['¿Cómo apruebo una promoción?', 'En Más → Promociones, filtro «Por revisar». Al aprobarla, el descuento se aplica en el servidor en cada pedido.'],
  ['¿Qué pasa si desactivo a un usuario?', 'No podrá iniciar sesión. Sus pedidos e historial se conservan y puedes reactivarlo.'],
  ['¿Puedo marcar un pedido como listo?', 'No. Los cambios de estado los hace la tienda; tú los supervisas.'],
] as const;

// ADM-13 · Ayuda y legal del admin (contenido estático de la versión de demostración).
export default function AyudaAdmin() {
  return (
    <Screen>
      <Section title="Preguntas frecuentes">
        {PREGUNTAS.map(([p, r]) => (
          <Card key={p}>
            <AppText variant="label">{p}</AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              {r}
            </AppText>
          </Card>
        ))}
      </Section>
      <Section title="Legal">
        <AppText variant="bodySm" color="onSurfaceVariant">
          Tus acciones quedan registradas en la auditoría. Usa los datos personales de clientes y comercios sólo para administrar la plaza. Retención (DEC-24): cuentas de cliente eliminadas a pedido con anonimización, avisos 90 días, reportes 12 meses y respaldo semanal fuera del repositorio.
        </AppText>
      </Section>
    </Screen>
  );
}
