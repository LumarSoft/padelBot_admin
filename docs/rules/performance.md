# Performance

## Memoization

- Do not use `React.memo`, `useMemo`, or `useCallback` by default
- Add them only after measuring a real performance problem (React DevTools Profiler)
- Premature memoization adds complexity without benefit

## Code splitting

- Lazy-load heavy routes with `React.lazy` + `Suspense`
- Lazy-load heavy components (rich text editors, charts, modals) that are not needed on first render

## Re-renders

- Identify hook dependencies carefully — an incorrect dependency array causes silent bugs
- Prefer stable references for callbacks passed to child components when those children are memoized
