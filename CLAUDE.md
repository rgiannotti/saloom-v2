# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Saloom v2 is a full-stack service booking/management platform. It's a **pnpm + Turborepo monorepo** consisting of:

- `apps/backend` — NestJS REST API with MongoDB
- `apps/backoffice` — React 19 + Vite admin dashboard
- `apps/client` — React Native (Expo) app for service professionals
- `apps/user` — React Native (Expo) app for end users
- `packages/ui` — Shared React components
- `packages/config` — Shared ESLint, Prettier, and TypeScript configs

## Commands

Run from the repo root using pnpm:

```bash
pnpm dev          # Start all apps in dev mode (via Turborepo)
pnpm build        # Build all apps/packages
pnpm lint         # ESLint across all packages
pnpm test         # Jest across all packages
pnpm format       # Prettier formatting
```

To run a command for a specific app:

```bash
pnpm --filter @saloom/backend dev
pnpm --filter @saloom/backoffice dev
pnpm --filter @saloom/client dev
pnpm --filter @saloom/user dev
```

To run a single test file:

```bash
cd apps/backend && pnpm test -- --testPathPattern=<filename>
```

## Architecture

### Backend (NestJS)

- **Entry**: `apps/backend/src/main.ts`
- **Module structure**: Each feature is a self-contained NestJS module in `src/modules/<feature>/` containing controllers, services, DTOs, and Mongoose schemas.
- **Auth**: JWT-based with Passport. Global guards `JwtAuthGuard` and `RolesGuard` protect routes. Public routes use a `@Public()` decorator.
- **Database**: MongoDB via Mongoose. Schemas are defined with `@Schema()` decorators in each module.
- **Environment**: Requires a `.env` file with `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `PORT` (default 3000).

### Backoffice (React + Vite)

- **Entry**: `apps/backoffice/src/main.tsx`
- **Routing**: react-router-dom v7 with page-based components in `src/pages/`
- **Auth**: Context API (`AuthContext`) with `ProtectedRoute` wrapper
- **Environment**: Vite env files (`.env.development`, `.env.staging`, `.env.production`) — requires `VITE_API_BASE_URL`.

### Mobile Apps (React Native + Expo)

- Both `client` and `user` apps follow the same pattern: screen-based navigation with Expo Router.
- `apps/client` includes i18n support and is aimed at service professionals.
- `apps/user` is the end-user facing app.

### Shared Packages

- `packages/ui` — Shared components imported as `@saloom/ui/*`
- `packages/config` — Shared configs imported as `@saloom/config/*`
- Path aliases are defined in `tsconfig.base.json` at the root.

## Key Conventions

- TypeScript everywhere; no `any` unless unavoidable.
- Backend modules are self-contained — add controllers, services, DTOs, and schemas within the module folder.
- Use `class-validator` decorators for DTO validation in the backend.
- Mobile apps use `dayjs` for date manipulation.
- Twilio is used for SMS and nodemailer for email in the backend.
