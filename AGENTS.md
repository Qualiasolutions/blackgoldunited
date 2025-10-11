# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains Next.js App Router routes, server actions, and feature folders.
- `components/` provides shared UI; prefer colocated domain widgets inside `app/`.
- `lib/` houses utilities and API clients, with shared shapes in `types/` and Supabase configs in `supabase/`.
- `__tests__/` mirrors library and API structure; Jest coverage artifacts land in `coverage/`.
- Use `public/` for static assets and mocks, `docs/` for specifications, and `scripts/` for operational automation.

## Build, Test, and Development Commands
- `npm run dev` starts the Turbopack dev server on Node 18+.
- `npm run build` compiles the production bundle; `npm run start` serves the result locally.
- `npm run lint` / `npm run lint:fix` enforce the ESLint + Next ruleset.
- `npm run type-check` runs TypeScript without emitting files.
- `npm test` (or `npm run test:watch`) executes Jest with jsdom and writes coverage to `coverage/`.
- `npm run env:setup`, `npm run env:validate`, and `npm run env:batch` keep Vercel/Supabase env vars in sync.

## Coding Style & Naming Conventions
- Author TypeScript + JSX with two-space indentation and default exports only when pages demand it.
- Use PascalCase for React components, camelCase for helpers, and SCREAMING_SNAKE_CASE for constants.
- Compose Tailwind classes through `cn` (`@/lib/utils`) to avoid drift; prefer functional, side-effect-free utilities.
- Run `npm run lint` before each push; there is no Prettier job, so rely on ESLint autofix.

## Testing Guidelines
- Jest is configured in `jest.config.js` with Testing Library helpers from `jest.setup.js`.
- Name specs `*.test.tsx?` inside `__tests__` to mirror the subject module or route.
- Maintain or raise statement coverage; review `coverage/lcov-report/index.html` before merging.

## Commit & Pull Request Guidelines
- Follow the existing emoji + summary format (e.g., `✨ Add: Purchase order detail page`, `🐛 Fix: Inventory permissions`) and reference issues (`#310`).
- Keep commits atomic; run lint, type-check, and unit tests locally pre-push.
- PRs should include context, UI screenshots when applicable, manual test notes, and links to Supabase migrations or docs updates.

## Security & Configuration Tips
- Do not commit secrets; manage them through Vercel, then sync locally with the env scripts.
- Document Supabase policy or index changes in `supabase/` and `DATABASE_INDEXES_APPLIED.md`, and monitor Sentry configs when touching error boundaries.
