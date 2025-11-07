# Saloom v2 Monorepo

Este repositorio usa una estructura de monorepo pensada para alojar múltiples aplicaciones y paquetes compartidos.

## Organización

- `apps/`
  - `user/`: aplicación móvil (React Native) para clientes finales.
  - `client/`: aplicación móvil (React Native) para clientes profesionales.
  - `backoffice/`: panel administrativo web (React).
  - `backend/`: API/servicios basados en NestJS.
- `packages/`
  - `ui/`: componentes compartidos (React o React Native).
  - `config/`: configuración reutilizable (ESLint, Prettier, tsconfig, etc.).

## Próximos pasos

1. Elegir gestor de paquetes (npm, pnpm, yarn) y ejecutar la instalación inicial.
2. Configurar herramientas comunes (TypeScript, linters, formateadores, CI/CD).
3. Añadir dependencias específicas por aplicación/paquete.

## Scripts útiles

- `pnpm install`: instala dependencias en todo el workspace.
- `pnpm dev`: ejecuta los comandos `dev` de cada paquete en paralelo mediante Turborepo.
- `pnpm build`: construye todas las apps/paquetes respetando dependencias.
- `pnpm lint`: corre ESLint compartido en cada proyecto.
- `pnpm test`: dispara las pruebas unitarias (Jest + ts-jest) de cada paquete.
- `pnpm format`: aplica Prettier a todo el repo.
- Sólo app client (Expo): `pnpm --filter @saloom/client dev`.
- Sólo app user (Expo): `pnpm --filter @saloom/user dev`.
