# State management

## Decision rules

- `useState`: local UI state only (open/close modal, form input value, toggle)
- `useReducer`: complex local state with multiple transitions
- React Query: all server/async state — do not duplicate server data in global state
- Zustand (or Context): shared client state that multiple components need (e.g. current user, sidebar open)

## Prop drilling

- Maximum 2 levels of prop passing — if you need a third, lift to Context or global state
- Prefer React Query's cache over passing server data through props

## Global state rules

- Global state holds data only — no business logic, no API calls inside stores
- Keep stores small and scoped by domain (e.g. `useAuthStore`, `useUiStore`)
