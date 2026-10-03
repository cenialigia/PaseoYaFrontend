# PaseoYA · Frontend

App móvil de PaseoYA (cliente, comercio y admin) con **Expo SDK 57 · React Native 0.86 · Expo Router**. Android es la primera plataforma (ADR-009).

La documentación, los requisitos y las decisiones viven en el Core, que no está dentro de este repositorio: [cenialigia/documentacionPaseoYa](https://github.com/cenialigia/documentacionPaseoYa). El backend está en [cenialigia/PaseoYaBackend](https://github.com/cenialigia/PaseoYaBackend).

## Requisitos

Node.js ≥ 22.13, npm, y un emulador Android o un dispositivo con Expo Go.

## Arranque

1. Levantar el backend: en `../backend`, `npm install` y `npm run db:start` (Docker Desktop abierto).
2. Crear `.env` desde `.env.example`:
   - `EXPO_PUBLIC_SUPABASE_URL`: `http://10.0.2.2:54321` en el emulador Android; `http://<IP-del-equipo>:54321` en un teléfono físico de la misma red.
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: la `PUBLISHABLE_KEY` de `npx supabase status -o env` en el backend. Nunca la `SECRET_KEY` ni la `service_role`.
3. `npm install` y `npm run android` (o `npx expo start`). Si se cambia el `.env`, reiniciar Metro.

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

## Guion de la demo (unos 3 minutos)

1. Ingresar como **cliente** → Carritos → «Ir a pagar en TechZone» → elegir «QR de pago (simulado)» → «Confirmar pedido».
2. En el pedido: «Simular pago» (no hay cobro real).
3. Perfil → «Cerrar sesión» → ingresar como **TechZone** → «Iniciar preparación» → «Marcar listo para retiro».
4. Salir → **cliente** → Pedidos → «Ver código de retiro»: QR + PIN.
5. Salir → **TechZone** → Listos → escribir el PIN → «Validar retiro». Un PIN incorrecto se rechaza; un pedido en efectivo exige confirmar el pago antes de entregar.
6. Salir → **admin** → pedidos por estado, comercios, ventas y reportes de clientes.

En Expo Go, el botón flotante de herramientas (engranaje) puede tapar «Perfil»: arrástrelo a otro borde.

> Estado: conectada al backend Supabase local (INT-01). Datos 100 % ficticios.
