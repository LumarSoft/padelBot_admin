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

This is the **GTP** owner panel + public landing for a multi-tenant padel-booking SaaS (see `../docs/BITACORA.md`). The backend is `../api` (NestJS). The panel never talks to the DB and never holds the JWT in JS — see the BFF/proxy section below.

## Architecture

App Router project. Code is split between routing (`src/app/`) and a feature-first `src/` layout:

- `src/app/page.tsx` — the **public marketing landing** at `/` (no auth). Composed from `src/features/landing/components/*`. This is the product's front door; the panel lives under `/panel`.
- `src/app/(dashboard)/` — the authenticated panel routes, all under `/panel`: `/panel` (Resumen/overview), `/panel/agenda`, `/panel/reservas`, `/panel/turnos`, `/panel/conversaciones`, `/panel/configuracion`. The layout calls `requireSession()`; login redirects here. Owner-only sections gate on `session.role === "owner"`.
- `src/app/(auth)/login` — login (`/login`). Redirects to `/panel` when already signed in.
- `src/app/api/**` — **the BFF layer**: internal Next route handlers that proxy to `../api`, attaching the JWT from the HttpOnly cookie. The browser calls these same-origin routes; the real API token never reaches client JS. `src/lib/api/proxy.ts` + `src/proxy.ts` centralize this.
- `src/features/<domain>/` — UI + hooks per domain (`landing`, `agenda`, `reservas`, `turnos`, `conversations`, `configuracion`, `auth`, `realtime`, `pagos`, `dashboard`, `onboarding`). Components colocate with their TanStack Query hooks. `landing` is presentational only (no data layer).
- `src/services/*.service.ts` — typed clients that call the BFF routes. `src/types/api/*` — request/response types mirroring the API.
- `src/lib/session.ts` — server-only session helpers (`getSession`, `requireSession`, cookie set/clear). The JWT is decoded for optimistic UI only; the API re-authorizes every request.
- `src/stores/auth-store.ts` — Zustand store for the client-side session mirror (`useAuthStore`).
- `src/components/ui/*` — design system primitives. **Several are Base UI** (`@base-ui/react`, e.g. `tabs.tsx`, `dialog.tsx`, `popover.tsx`, `select.tsx`), not Radix — check the import before assuming the API.
- `src/app/layout.tsx` — root layout (Geist / Geist Mono fonts → `--font-geist-sans` / `--font-geist-mono`). `src/app/providers.tsx` wires TanStack Query + theme + toaster.
- `src/app/globals.css` — Tailwind v4 entry. Uses `@import "tailwindcss"` + `@theme inline` (no `tailwind.config.js`); design tokens (incl. the `--brand` color) live here.

**Plans:** `src/lib/plans.ts` holds the plan keys (`saque` / `bandeja` / `smash`); prices and copy are sold in `features/landing/lib/plans.ts`. What the club's plan allows comes from the API (`GET /clubs/me/plan` → `features/plan`: `usePlan`, `useFeature`, `PlanLimitNotice`, `PlanUpsell`, the "Tu plan" card and the AI-credits banner). The API enforces it; the panel only explains it before the refusal, and `useFeature` reads as enabled while loading so nothing hides on a guess.

**Billing:** `/panel/facturacion` (owner only, `features/billing`) shows the plan and its renewal and this month's credits ("créditos de IA": one per WhatsApp message the bot sends) against the plan's. The sidebar's credits bar and the owner's card open it. Credits can't be bought: the way to more is a bigger plan ("Cambiar plan", a WhatsApp to Lumarsoft, also on the credits banner). The credits banner warns the owner with 20%, 10% and 5% left (each can be closed; the next level shows again); at 100% the bot is paused (`aiCredits.paused`) and the banner can't be closed and shows to the staff too, pointing them to Conversaciones. Never mention Meta or a per-message cost to the club. The ops console's `/ops/rentabilidad` shows revenue against Meta and OpenAI cost per club and month.

**Kiosco and the point of sale:** the owner's Productos (`/panel/productos`, `features/productos`) and the staff's Kiosco (`/panel/kiosco`) share `features/kiosco/components/kiosco-tabs.tsx`: it opens on «Mostrador», the point of sale (`features/kiosco/components/pos/`), then the screen's own tab (priced Catálogo / plain Stock), «Para comprar» and «Ventas de hoy»; the tab lives in `?tab=` so a help guide can open the right one. The POS has two color-coded modes: «Cobrar» (emerald: the ticket goes to `POST /stock/counter-sales` with the chosen payment method, cash shows the change, and the sale can be undone right after) and «Cargar stock» (sky: the delivery goes to `POST /stock/purchases`). A barcode scanner is just a keyboard that types the code and Enter: the scan box is an **uncontrolled** input, and `hooks/use-type-to-scan.ts` sends any printable key typed outside a text field into it, so a scan works wherever the focus is and its Enter never presses a focused button. On Enter, `lib/pos.ts` `resolveEntry` decides: an exact `barcode` always wins, then a typed name picks its highlighted match (arrows move it), and a code-looking text nobody has is looked up with `GET /products/by-barcode` and then offered to link to a product without a code or to create one (`unknown-code-dialog.tsx`). A scan that lands in a quantity or "paga con" field (8+ characters on Enter) is passed to the scanner instead. Tickets live in `stores/pos-store.ts` (in memory, survives moving around the panel). «Cargar stock» respects the plan: without `kioscoStock` only products already tracked can be loaded. The only other kiosk action is «Contar stock» in the page header; the old «Venta suelta» and «Entró mercadería» dialogs are gone. The product form has the `barcode` field (Enter there never submits: the scanner sends one).

**Counter feedback and shortcuts:** every scan answers with a sound and the scan box with a pulse, in the POS and in the turno's bill. `features/kiosco/lib/pos-sound.ts` synthesizes the cues with Web Audio (no files): «added» (one high bip), «unknown» (two flat beeps), «error» (a low buzz: nothing was added), «done» (charged, delivery loaded, bill payment registered) and «undo». The scanner's own beep only means it read a code; ours means the panel did something with it. A scan is a keypress, which counts as the user gesture browsers require for audio. The «Sonido» toggle next to the POS modes mutes it per computer (`localStorage` `gtp:pos-sound`; the bill follows it). `components/pos/scan-pulse.tsx` tints the box (the screen's accent = added, amber = unknown code, red = nothing) and shakes it with the Web Animations API, because re-keying the box would remount its uncontrolled input. The POS shortcuts are function keys (`hooks/use-function-keys.ts`), since a scanner never sends one: F1 Efectivo, F2 QR, F3 Transferencia, F4 charges («Cobrar») or loads («Sumar al stock»), F8/F9 switch to «Cobrar»/«Cargar stock». F5–F7 and F10–F12 are left to the browser. Shortcuts are ignored inside a dialog or an open menu. A quantity half typed is committed (blurred) first, which is why `charge()`/`submit()` read the lines from `usePosStore.getState()` and not from the render. Each button shows its key (`key-hint.tsx`) only on `pointer-fine` screens. F4 with no payment method buzzes and shakes the three buttons.

**The turno's bill takes the scanner too:** «Cuenta del turno» (`features/productos/components/add-products-dialog.tsx`, opened from the Agenda, the bookings list and Pagos) has the same uncontrolled scan box on top, resolved with the same `resolveEntry` and the same unknown-code dialog (mounted inside the bill's popup, so it opens nested). The page-wide `useTypeToScan` stays out of dialogs, so the bill calls it with `scope: "dialog"`: printable keys typed anywhere in that dialog go to its box and stop there (a focused select would otherwise type-ahead a product), so the scanner's Enter never presses «Guardar y cerrar» or a payment button. Every way of adding (scan, typed name, the «＋ Agregar consumo del catálogo» select) adds one unit to the line with that product and the «Cargar a» choice (Todos = split among the four, or one J; shown only with split payment), and a new line the first time. A deactivated product is refused. Nothing changed in the API: saving the bill still moves stock by the net change.

**Ops follow-up:** each club has a ficha at `/ops/clubes/[id]` (plan, dates, 6 months of credits, bookings and margin, where it came from, our notes). Leads have a call-back date ("Para hoy" list), a reason when marked lost and the campaign they came from: the landing keeps the UTM parameters for the tab (`features/landing/components/utm-capture.tsx` → `sessionStorage`, no cookie) and the signup sends them with the answers. The signup also counts each screen once per page load, anonymously (`POST /api/onboarding/funnel`), which the leads screen shows as "Dónde abandonan el registro". Negocio adds the month-by-month MRR, new paying clubs and churn, and a preview of the Monday summary.

**Torneos y peñas:** `/panel/torneos` and `/panel/penas` (+ `/[id]`), one feature (`features/competitions`) over the API's `/competitions`. Both kinds share the detail screen: Inscriptos (pairs, per-player fee paid/method) and Partidos (round robin by wave, zonas with their tables, the bracket). Creating or editing an event blocks its courts in the agenda (the API refuses with a 409 listing any booked turno in the way); the agenda labels those cells «Torneo · …» / «Peña · …» from `Slot.competition`. Every write returns the full event and the SSE `competition.changed` refreshes it on other screens. Torneos are created only here; the staff app creates peñas and runs pairs, payments and results.

**Mejoras:** `/panel/mejoras` (owner and staff, `features/improvements`) lists what Lumarsoft published (`GET /improvements`: planeada / en desarrollo / lanzada) and lets the club propose improvements and read our answer (`/improvements/suggestions`). We answer and post from the ops console's `/ops/mejoras` (the nav badge counts NEW suggestions) or from the API with `npm run improvement:post`. Separate from the "?" help's Novedades (`features/help/content/news.ts`, tied to guides). The staff app has the same screen under Ajustes → Mejoras.

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
