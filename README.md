# PaseoYA · Frontend

App móvil de PaseoYA (cliente, comercio y admin) con **Expo SDK 57 · React Native 0.86 · Expo Router**. Android es la primera plataforma (ADR-009).

La documentación, los requisitos y las decisiones viven en el Core, que no está dentro de este repositorio: [cenialigia/documentacionPaseoYa](https://github.com/cenialigia/documentacionPaseoYa). El backend está en [cenialigia/PaseoYaBackend](https://github.com/cenialigia/PaseoYaBackend).

## Requisitos

Node.js ≥ 22.13, npm, y un emulador Android o un dispositivo con Expo Go.

## Arranque

1. Levantar el backend: en `../backend`, `npm install` y `npm run db:start` (Docker Desktop abierto).
2. Crear `.env` desde `.env.example`:
   - `EXPO_PUBLIC_SUPABASE_URL`: `http://127.0.0.1:54321` con `adb reverse` (recomendado: sirve igual en el emulador y en un teléfono por USB). Sin USB: `http://10.0.2.2:54321` en el emulador o `http://<IP-del-equipo>:54321` en un teléfono de la misma red.
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: la `PUBLISHABLE_KEY` de `npx supabase status -o env` en el backend. Nunca la `SECRET_KEY` ni la `service_role`.
3. Con cada dispositivo conectado (emulador o teléfono por USB con depuración activada), redirigir los puertos:

   ```bash
   adb -s <dispositivo> reverse tcp:8081 tcp:8081
   adb -s <dispositivo> reverse tcp:54321 tcp:54321
   ```

4. `npm install` y `npx expo start`. En el dispositivo, abrir Expo Go con `adb -s <dispositivo> shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8081 host.exp.exponent`. Si se cambia el `.env`, reiniciar Metro.

La app usa Supabase Auth, lee el catálogo y los pedidos con RLS, y todas las escrituras de pedidos pasan por las funciones del backend (`confirmar_pedido`, `simular_pago`, `cancelar_pedido`, `avanzar_pedido`, `confirmar_efectivo`, `validar_retiro`). Los pedidos se actualizan en tiempo real con Supabase Realtime. El carrito vive en el dispositivo (no aparta stock: DEC-05).

Verificación: `npx expo-doctor`, `npx tsc --noEmit` y `npx expo lint`.

## Build de demostración (APK con EAS)

La app instalable apunta al proyecto Supabase en la nube; sus variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` viven en el entorno `preview` de EAS, no en `.env`.

```bash
npx eas-cli@latest build --platform android --profile preview
```

Al terminar, EAS da un enlace y un QR para descargar el APK en el teléfono (Android pide permitir la instalación desde el navegador). Antes de una build, aplica las migraciones pendientes a la nube desde `../backend` con `npx supabase db push --linked`. En la nube, «¿Olvidaste tu contraseña?» no envía el código de 6 dígitos: el plan gratuito no permite editar la plantilla del correo sin un SMTP propio.

## Cuentas de demostración (ficticias)

Vienen del seed del backend (`npm run db:reset` las restablece). Contraseña de todas: `demo1234`.

| Rol | Correo | Entra en |
| --- | --- | --- |
| Cliente (María Fernanda) | `cliente@paseoya.demo` | Inicio, Mis pedidos, Promociones, Perfil |
| Cliente 2 | `cliente2@paseoya.demo` | Igual que el anterior |
| Comercio (TechStore) | `techstore@paseoya.demo` | Inicio, Pedidos, Productos, Ventas |
| Comercio (Fashion Store) | `fashion@paseoya.demo` | Igual que el anterior |
| Comercio (Sabor Criollo) | `saborcriollo@paseoya.demo` | Igual que el anterior |
| Admin Paseo Aranjuez | `admin@paseoya.demo` | Inicio, Comercios, Usuarios, Pedidos, Más |

También se puede crear una cuenta de cliente desde «Crear cuenta» (con foto de perfil opcional). «¿Olvidaste tu contraseña?» envía un código de 6 dígitos; en local el correo llega a Mailpit (http://127.0.0.1:54324).

## Guion de la demo (unos 3 minutos, dos dispositivos)

Antes de empezar: `npm run db:reset` en el backend deja el seed limpio. Ideal: un teléfono como **cliente** y un emulador o segundo teléfono como **comercio**; los cambios se ven en tiempo real en ambos.

1. **Cliente:** Inicio → Tecnología → TechStore → «Agregar al carrito» en el cargador → carrito → «Continuar» → «Pagar en efectivo» → «Continuar» (reserva de 72 h).
2. **Comercio (TechStore):** la campana avisa del pedido nuevo → Pedidos → abrir el pedido → «Empezar preparación» → «Marcar como listo» (cada paso pide confirmación). En el teléfono del cliente el estado cambia solo.
3. **Cliente:** Mis pedidos → Reservas → «Ver ticket» → QR + PIN. La campana muestra cada cambio de estado.
4. **Comercio:** «Gestionar retiro» (o «Escanear retiro» en Inicio) → leer el QR del ticket con la cámara o «Escribir PIN» → se verifica sin gastar el código → «Confirmar cobro en efectivo» → «Confirmar entrega». Un PIN incorrecto o ya usado se rechaza. En el teléfono del cliente el ticket pasa a «ya se usó».
5. **Admin:** Inicio con ventas del día y promociones por revisar → aprobar o rechazar (Más → Promociones) → alta de un comercio con su cuenta (Comercios → «Nuevo comercio») → desactivar un usuario → auditoría de cada acción.
6. Variante QR: elegir «Pagar con QR (simulado)»; el QR vence en 5 minutos y «Simular pago» lo confirma. Los audífonos tienen 40 % de descuento: el servidor fija Bs 180,00 al confirmar.

En Expo Go, el botón flotante de herramientas (engranaje) puede tapar «Perfil»: arrástrelo a otro borde.

> Estado: conectada al backend Supabase local (INT-01). Datos 100 % ficticios.
