import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen, Section } from '@/components/ui/screen';

const PREGUNTAS = [
  ['¿Cómo recojo mi pedido?', 'Cuando la tienda lo marque como listo verás tu código de recojo (QR y PIN) en el ticket. Muéstralo en el local.'],
  ['¿Cuánto tiempo tengo para recoger?', 'Las reservas en efectivo duran 72 horas y las compras con QR, 14 días desde la confirmación.'],
  ['¿Puedo cancelar?', 'Sí, mientras el pedido esté «Confirmado». Una vez que la tienda empieza a prepararlo ya no se puede cancelar desde la app.'],
  ['¿El pago con QR es real?', 'No. En esta versión el pago con QR es simulado y no se cobra dinero.'],
] as const;

// F14-X-04 · Ayuda y legal (contenido estático de la versión de demostración).
export default function Ayuda() {
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
          PaseoYa es una versión de demostración con datos ficticios. Tus datos personales se usan para gestionar tus pedidos (la tienda ve tu nombre y teléfono sólo mientras tu pedido está activo) y, de forma agregada, para estadísticas de la plaza. Puedes eliminar tu cuenta desde Perfil: se borran tus datos y tu foto, y tus pedidos quedan anónimos. Los avisos se borran a los 90 días y los reportes a los 12 meses.
        </AppText>
      </Section>
      <Button label="Reportar un problema" variant="outline" onPress={() => router.push('/reportar')} />
    </Screen>
  );
}
