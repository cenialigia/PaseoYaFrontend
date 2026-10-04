import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen, Section } from '@/components/ui/screen';

const PREGUNTAS = [
  ['¿Cómo entrego un pedido?', 'En Pedidos, abre el pedido listo y toca «Gestionar retiro». Escanea el QR del ticket del cliente o escribe su PIN, revisa el pedido y toca «Confirmar entrega».'],
  ['¿Y si el cliente paga en efectivo?', 'Después de verificar el código, cobra el total y toca «Confirmar cobro en efectivo». Recién entonces podrás confirmar la entrega.'],
  ['¿Puedo borrar un producto?', 'Sólo si nunca se pidió. Si ya tiene pedidos, desactívalo: los clientes dejan de verlo y el historial se conserva.'],
  ['¿Cuándo se publica mi promoción?', 'Cuando la administración de Paseo Aranjuez la aprueba. Mientras tanto la verás «En revisión».'],
  ['¿El pago con QR es real?', 'No. En esta versión el pago con QR es simulado y no se mueve dinero.'],
] as const;

// COM-13 · Ayuda y legal del comercio (contenido estático de la versión de demostración).
export default function AyudaComercio() {
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
          PaseoYa es una versión de demostración con datos ficticios. El nombre y el teléfono del cliente sólo se muestran mientras su pedido está activo y deben usarse
          únicamente para gestionar ese pedido. La política de retención de datos está pendiente de aprobación.
        </AppText>
      </Section>
    </Screen>
  );
}
