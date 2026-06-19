# Git

## Commit format (Conventional Commits)

- `feat:` new feature
- `fix:` bug fix
- `chore:` tooling, dependencies, config
- `refactor:` code change with no behavior change
- `docs:` documentation only
- `style:` formatting (should be rare — Prettier handles this automatically)
- `test:` adding or fixing tests

Examples:

- `feat: add policy list view with filters`
- `fix: correct date format in claims form`
- `refactor: extract useClientSearch hook from ClientList`

## Rules

- No commented-out code in any commit
- No `console.log` in any commit
- One PR = one responsibility — do not mix a new feature with a refactor
- PR title must follow the same Conventional Commits format
