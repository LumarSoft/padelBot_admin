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

This is the **PadelBot** owner panel + public landing for a multi-tenant padel-booking SaaS (see `../docs/BITACORA.md`). The backend is `../padelBot_api` (NestJS). The panel never talks to the DB and never holds the JWT in JS — see the BFF/proxy section below.

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

Club creation is **managed**, and it has two halves.

**1. The signup** (`/register`, `src/features/signup`) — a public, full-screen, one-question-per-screen flow (not a form). Choice questions are a single tap and auto-advance; the prompts address the prospect by name once they've given it. It ends in an **editable review** (correcting one answer returns straight to the review — it never re-walks the flow) and posts to `POST /onboarding/request`. The questions are declared in `lib/questions.ts` and do double duty: they **pre-load the `/setup` wizard** (courts, hours, price, deposit policy) so provisioning is half done before we ever sit with the club, and they qualify the lead. The ops alert renders them as a readable briefing.

Two things that are easy to break here, both of which were live bugs:
- `/register` **must** be in the proxy's `PUBLIC_ROUTES` — a prospect has no session, and anything else bounces the landing's main CTA to `/login`.
- Its BFF route **must** use `proxyPublicToApi`, not `proxyToApi` — the authenticated proxy 401s a request with no session cookie, i.e. every signup.
- It also lives **outside** the `(auth)` route group, whose layout boxes children into a 384px card.

**2. The provisioning + setup.** We create the tenant (`POST /onboarding/register` with the ops secret); the club is created **empty** — no demo courts or example bookings.

The complex is then configured in the **account setup wizard** at `/setup` (`src/features/setup`), a full-screen, owner-only flow we normally drive sitting with the club. Seven steps — complejo → canchas → cobros/MercadoPago → WhatsApp → turnos fijos → equipo → kiosco — each of which **can be skipped** and stays editable from `/panel/configuracion` afterwards. Key pieces:

- **The wizard writes through the panel's existing endpoints** (courts, transfer-config, whatsapp-lines, users, products, recurring-bookings). It owns no write logic of its own; the only onboarding-specific routes are `GET /onboarding/status` (aggregated state), `PATCH /onboarding/progress` (resume position) and `POST /onboarding/complete`.
- **Step state is derived from real data**, never from stored progress — a club configured by hand reads as done without opening the wizard. `status.ready` gates on the three steps the bot can't run without (canchas, pagos, whatsapp).
- **The screen lives in the URL** (`/setup?step=pagos`), because MercadoPago's OAuth callback bounces the browser out of the app and must land the owner back on the step they left. That return path is carried inside the encrypted OAuth `state` (`origin: "setup" | "configuracion"`) and resolved against a whitelist API-side — never a caller-supplied URL.
- **`BotPreview`** renders a live WhatsApp mock from the config being typed (real court prices, the real seña amount, the real alias), so nothing is configured blind.

`SetupChecklist` (`src/features/onboarding`) is now only the panel's entry point into the wizard — it reports, it doesn't configure. When stuck, the owner contacts **Lumarsoft** by WhatsApp/email (`src/lib/contact.ts`).
