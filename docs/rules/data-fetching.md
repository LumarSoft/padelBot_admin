# Data fetching

## React Query

- Use TanStack Query (React Query) for all server state — no `useEffect + fetch` for data loading
- Define query keys as constants in `src/lib/query-keys.ts`
- Mutations use `useMutation` with `onSuccess` / `onError` callbacks

## Services layer

- All API calls live in `src/services/` — components and hooks never call `fetch` directly
- One file per domain: `src/services/policies.service.ts`, `src/services/clients.service.ts`
- Every service function must have typed request params and typed return value

## Typing

- Define request and response types in `src/types/api/`
- Never trust the API response as `any` — always parse and type it
