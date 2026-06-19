# Error handling

## Async

- Always wrap async calls in try/catch or handle with .catch() — no unhandled promise rejections
- Surface errors to the user with a clear message — never swallow errors silently

## React

- Use Error Boundaries around route segments and heavy feature areas
- Provide a fallback UI in every Error Boundary — never show a blank screen

## Logging

- No `console.log` in committed code — use the project's logging utility (`src/lib/logger.ts`)
- `console.error` is allowed temporarily during development but must not be committed
