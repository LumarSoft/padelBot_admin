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

## Architecture

App Router project. All routes and UI live under `app/`:

- `app/layout.tsx` — root layout. Loads the Geist / Geist Mono fonts via `next/font/google` and exposes them as the `--font-geist-sans` / `--font-geist-mono` CSS variables on `<html>`.
- `app/page.tsx` — the `/` route.
- `app/globals.css` — Tailwind v4 entry. Imported once in the root layout. Uses the v4 `@import "tailwindcss"` + `@theme inline` syntax (no `tailwind.config.js`); design tokens (`--background`, `--foreground`, font vars) are declared here.

Path alias: `@/*` maps to the project root (e.g. `@/app/...`).

Static assets go in `public/` and are served from `/`.
