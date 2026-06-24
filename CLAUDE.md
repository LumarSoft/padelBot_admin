# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: non-standard Next.js

This project uses **Next.js 16.2.9** with **React 19** and **Tailwind CSS v4**. These versions have breaking changes from older, more widely documented releases. Before writing framework code, read the relevant guide in `node_modules/next/dist/docs/` rather than relying on prior knowledge of Next.js conventions, and heed any deprecation notices. (This rule comes from `AGENTS.md`, which `CLAUDE.md` includes.)

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

No test runner is configured yet.

## Product

This is the **Canchea** owner panel + public landing for a multi-tenant padel-booking SaaS (see `../docs/BITACORA.md`). The backend is `../padelBot_api` (NestJS). The panel never talks to the DB and never holds the JWT in JS — see the BFF/proxy section below.

## Architecture

App Router project. Code is split between routing (`src/app/`) and a feature-first `src/` layout:

- `src/app/page.tsx` — the **public marketing landing** at `/` (no auth). Composed from `src/features/landing/components/*`. This is the product's front door; the panel lives under `/panel`.
- `src/app/(dashboard)/` — the authenticated panel routes, all under `/panel`: `/panel` (Resumen/overview), `/panel/agenda`, `/panel/reservas`, `/panel/turnos`, `/panel/conversaciones`, `/panel/configuracion`. The layout calls `requireSession()`; login redirects here. Owner-only sections gate on `session.role === "owner"`.
- `src/app/(auth)/login` — login (`/login`). Redirects to `/panel` when already signed in.
- `src/app/api/**` — **the BFF layer**: internal Next route handlers that proxy to `padelBot_api`, attaching the JWT from the HttpOnly cookie. The browser calls these same-origin routes; the real API token never reaches client JS. `src/lib/api/proxy.ts` + `src/proxy.ts` centralize this.
- `src/features/<domain>/` — UI + hooks per domain (`landing`, `agenda`, `reservas`, `turnos`, `conversations`, `configuracion`, `auth`, `realtime`, `pagos`, `dashboard`, `onboarding`). Components colocate with their TanStack Query hooks. `landing` is presentational only (no data layer).
- `src/services/*.service.ts` — typed clients that call the BFF routes. `src/types/api/*` — request/response types mirroring the API.
- `src/lib/session.ts` — server-only session helpers (`getSession`, `requireSession`, cookie set/clear). The JWT is decoded for optimistic UI only; the API re-authorizes every request.
- `src/stores/auth-store.ts` — Zustand store for the client-side session mirror (`useAuthStore`).
- `src/components/ui/*` — design system primitives. **Several are Base UI** (`@base-ui/react`, e.g. `tabs.tsx`, `dialog.tsx`, `popover.tsx`, `select.tsx`), not Radix — check the import before assuming the API.
- `src/app/layout.tsx` — root layout (Geist / Geist Mono fonts → `--font-geist-sans` / `--font-geist-mono`). `src/app/providers.tsx` wires TanStack Query + theme + toaster.
- `src/app/globals.css` — Tailwind v4 entry. Uses `@import "tailwindcss"` + `@theme inline` (no `tailwind.config.js`); design tokens (incl. the `--brand` color) live here.

State/data conventions: **TanStack Query** for server state (keys in `src/lib/query-keys.ts`), **sonner** for toasts, real-time panel updates via **SSE** (`src/features/realtime`). Currency is stored in cents; format with `src/lib/format.ts`. Build WhatsApp deep links with `src/lib/whatsapp.ts`.

Path alias: `@/*` maps to `src/` (e.g. `@/features/...`, `@/lib/...`). Static assets go in `public/`.

## Onboarding & configuration flow

A new club's owner must be able to set the complex up in ~15 minutes. The panel exposes this as a **setup checklist** (`src/features/onboarding`) shown on the overview and at the top of `/configuracion`, driving the owner through: club data → WhatsApp line → MercadoPago/transfer alias → first court (with padel presets). When stuck, the owner contacts **Lumarsoft** by WhatsApp/email (`src/lib/contact.ts`). The full spec lives in `../docs/ONBOARDING-Y-CONFIGURACION.md`; pending work is in `../docs/ROADMAP.md`.
