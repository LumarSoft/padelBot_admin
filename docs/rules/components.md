# Components

## General

- Functional components only — no class components
- Separate logic from rendering: extract business logic into custom hooks
- No business logic inside a component's JSX — the component should only render

## shadcn/ui

- Use shadcn/ui components as the UI base whenever a suitable component exists
- Do not rebuild from scratch what shadcn already provides (Button, Input, Dialog, etc.)
- Customize via Tailwind classes or CSS variables, never by modifying shadcn source files directly

## Reusability

- If a component is used in more than one place, it lives in `src/components/ui/`
- If a component is specific to a business domain, it lives in `src/features/<domain>/components/`

## components/ui vs components/features

- `src/components/ui/`: generic, reusable, domain-agnostic (e.g. `DataTable`, `PageHeader`, `EmptyState`)
- `src/features/`: specific to the business (e.g. `PolicyStatusBadge`, `ClientSummaryCard`)
- Never import from `features/` inside `components/ui/` — the dependency goes one way only

## Hooks

- Custom hooks live in `src/hooks/` (shared) or `src/features/<domain>/hooks/` (domain-specific)
- A hook that is only used by one component can live next to that component, but must be in its own file
- Never define a hook inside a component file
