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

## Cuentas de demostración (ficticias)

Vienen del seed del backend (`npm run db:reset` las restablece). Contraseña de todas: `demo1234`.

| Rol | Correo | Entra en |
| --- | --- | --- |
| Cliente | `cliente@paseoya.demo` | Explorar, Buscar, Carritos, Pedidos, Perfil |
| Comercio (TechZone) | `techzone@paseoya.demo` | Panel de comercio |
| Comercio (Boutique) | `boutique@paseoya.demo` | Panel de comercio |
| Admin Paseo Aranjuez | `admin@paseoya.demo` | Supervisión |

También se puede crear una cuenta de cliente desde «Crear cuenta de cliente».

## Guion de la demo (unos 3 minutos, dos dispositivos)

Antes de empezar: `npm run db:reset` en el backend deja el seed limpio. Ideal: un teléfono como **cliente** y un emulador o segundo teléfono como **comercio**; los cambios se ven en tiempo real en ambos.

1. **Cliente:** Buscar «cargador» → «Agregar al carrito de TechZone» → Carritos → «Ir a pagar en TechZone» → «Efectivo al retirar» → «Confirmar pedido».
2. **Comercio (TechZone):** el pedido aparece solo en «Por atender» → «Iniciar preparación» → «Marcar listo para retiro». En el teléfono del cliente el estado cambia solo.
3. **Cliente:** «Ver código de retiro» → QR + PIN.
4. **Comercio:** Listos → «Confirmar pago en efectivo» → escribir el PIN → «Validar retiro». Un PIN incorrecto se rechaza. En el teléfono del cliente el ticket pasa a «ya se usó».
5. **Admin:** ventas, pedidos por estado, comercios y reportes.
6. Variante QR: elegir «QR de pago (simulado)» y pulsar «Simular pago» en el pedido.

En Expo Go, el botón flotante de herramientas (engranaje) puede tapar «Perfil»: arrástrelo a otro borde.

> Estado: conectada al backend Supabase local (INT-01). Datos 100 % ficticios.
