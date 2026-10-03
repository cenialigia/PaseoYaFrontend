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

> Estado: plantilla base de F0-03. Las pantallas de PaseoYA llegan en LUI-02 y siguientes.
