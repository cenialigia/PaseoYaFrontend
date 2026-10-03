# PaseoYA · Frontend

App móvil de PaseoYA (cliente, comercio y admin) con **Expo SDK 57 · React Native 0.86 · Expo Router**. Android es la primera plataforma (ADR-009).

La documentación, los requisitos y las decisiones viven en el Core, que no está dentro de este repositorio: [cenialigia/documentacionPaseoYa](https://github.com/cenialigia/documentacionPaseoYa). El backend está en [cenialigia/PaseoYaBackend](https://github.com/cenialigia/PaseoYaBackend).

## Requisitos

Node.js ≥ 22.13, npm, y un emulador Android o un dispositivo con Expo Go.

## Arranque

```bash
npm install
cp .env.example .env   # rellenar con `npx supabase status` del backend local
npm run android        # o: npx expo start
```

Verificación: `npx expo-doctor` y `npx tsc --noEmit`. El archivo `expo-env.d.ts` se genera con el primer `expo start`.

## Cuentas de demostración (ficticias)

Datos en memoria: se reinician al cerrar la app. Contraseña de todas: `demo1234`.

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

> Estado: demo con datos simulados en memoria (sin backend). El backend Supabase está en el repositorio PaseoYaBackend.
