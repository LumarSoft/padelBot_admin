# PadelBot Admin

Panel de administración (web) del SaaS **PadelBot**. Cada club de pádel entra acá para **gestionar sus turnos y dirigir las conversaciones de su bot**. Construido con **Next.js 16**, **React 19** y **Tailwind CSS v4** (App Router).

Este repo es uno de los dos que componen el producto:

| Repo | Rol |
| ---- | --- |
| **`padelbot_admin`** (este) | Panel web. Login multitenant + administración de turnos, reservas y conversaciones del bot. |
| **`padelbot_api`** | API REST + bot multitenant (NestJS + Prisma). Expone los endpoints que consume este panel. |

> ⚠️ **No es el Next.js de siempre.** Este proyecto usa **Next.js 16.2.9 + React 19 + Tailwind v4**, con breaking changes respecto a versiones más documentadas. Antes de escribir código de framework, leé la guía correspondiente en `node_modules/next/dist/docs/` en vez de fiarte de convenciones viejas. (Ver `AGENTS.md` / `CLAUDE.md`.)

---

## 1. La idea (visión de producto)

PadelBot es un **SaaS multitenant** que se vende a varios clubes de pádel. El bot (en `padelbot_api`) atiende a los jugadores por WhatsApp y resuelve reservas de turnos de forma **híbrida**: por menús/opciones en el camino feliz, y con un **LLM (OpenAI)** cuando el jugador escribe en lenguaje natural.

Este panel es la **cara de administración** para el staff de cada club. Cada usuario pertenece a **un club (tenant)** y solo ve los datos de su club. Desde acá el club puede:

- **Administrar la oferta de turnos**: crear, editar y dar de baja los turnos/horarios que ofrece (canchas, fechas, precios, disponibilidad).
- **Ver y editar reservas**: el listado de turnos reservados, su estado, cancelarlos o ajustarlos.
- **Supervisar las conversaciones del bot**: ver en vivo los hilos entre jugadores y el bot.
- **Interrumpir y tomar el control** (handoff humano): pausar el bot en una conversación, escribir manualmente y después reanudarlo.

> Todo lo que ve y hace este panel está **acotado al club del usuario logueado**. El aislamiento real se garantiza en la API (filtro por `clubId`); el panel nunca debe asumir acceso a datos de otro club.

---

## 2. Stack

- **Next.js 16.2.9** (App Router).
- **React 19.2**.
- **Tailwind CSS v4** (sintaxis `@import "tailwindcss"` + `@theme inline` en `app/globals.css`, **sin** `tailwind.config.js`).
- **TypeScript**.
- Alias de import: `@/*` → raíz del proyecto.

> **Estado actual:** proyecto recién scaffoldeado con `create-next-app`. Solo existen `app/layout.tsx`, `app/page.tsx` y `app/globals.css`. Todo lo de abajo es el trabajo a construir.

---

## 3. Cómo se conecta con la API

- El panel **no toca la base de datos**: todo pasa por la API REST de `padelbot_api`.
- **Auth**: login contra la API, que devuelve un **JWT con el `clubId`** del usuario. El panel guarda el token y lo manda en cada request. El tenant lo determina el token, no la UI.
- Configurar la URL base de la API por variable de entorno (p. ej. `NEXT_PUBLIC_API_URL`).
- Seguir las reglas de data fetching del repo (`docs/rules/data-fetching.md`): preferir Server Components / fetch en el servidor cuando aplique, y mantener el token fuera del alcance del cliente donde sea posible.

---

## 4. Estructura de rutas propuesta

Bajo `app/` (App Router). A refinar por el equipo:

```
app/
  (auth)/
    login/                 # login del staff del club
  (dashboard)/
    layout.tsx             # layout protegido (requiere sesión) + nav del club
    page.tsx               # resumen / overview
    turnos/                # administrar la oferta de turnos (CRUD)
    reservas/              # ver y editar reservas
    conversaciones/        # listado de conversaciones del bot
      [id]/                # detalle: historial + interrumpir / escribir / reanudar
    configuracion/         # datos del club, canal (WhatsApp), etc.
```

Pantallas clave:

- **Turnos** — CRUD de la oferta de turnos del club ("qué turnos da el club").
- **Reservas** — listado editable de reservas, con estados y cancelación.
- **Conversaciones** — lista + detalle del hilo jugador↔bot, con acciones de **tomar control / enviar mensaje / reanudar bot**.
- **Configuración** — datos del club y credenciales del canal.

---

## 5. Roadmap sugerido

1. **Auth + sesión multitenant**: pantalla de login contra la API, manejo del JWT y rutas protegidas.
2. **Layout del dashboard**: navegación y shell del panel ya acotado al club.
3. **Turnos**: CRUD de la oferta de turnos (la base del valor para el club).
4. **Reservas**: listado y edición/cancelación.
5. **Conversaciones**: lista y detalle del hilo del bot.
6. **Handoff humano**: interrumpir, enviar mensaje manual y reanudar el bot desde el detalle de la conversación.
7. **Configuración**: datos del club y conexión del canal.

> El roadmap del panel sigue al de la API: cada pantalla depende de que existan sus endpoints en `padelbot_api`.

---

## 6. Puesta en marcha

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

> Si la API corre en `http://localhost:3000`, cambiá el puerto del panel (`npm run dev -- -p 3001`) o el de la API para no chocar.

### Variables de entorno

```
NEXT_PUBLIC_API_URL="http://localhost:3000"   # URL base de padelbot_api
```

### Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run start    # sirve el build
npm run lint     # ESLint
```

No hay test runner configurado todavía.

---

## 7. Reglas del repo

El código sigue las reglas en `docs/rules/` (referenciadas desde `CLAUDE.md` / `AGENTS.md`):

- `code-style.md`
- `components.md`
- `data-fetching.md`
- `error-handling.md`
- `state-management.md`
- `performance.md`
- `git.md`
