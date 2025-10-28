# Repository Guidelines

## Project Structure & Module Organization

TypeScript sources live in `src/`. `src/agents` hosts the conversational agents, `src/memory` manages cross-session state, `src/sdk` wraps RabbitMQ, while `src/utils`, `src/types`, and `src/config` provide helpers, DTOs, and routing presets. Deployment-facing config (`agents.json`, `system.json`, `rabbitmq.conf`) sits in `config/`, automation lives in `scripts/`, compiled output lands in `dist/`, and transient chat data is held in `sessions/`. Keep `.env` curated from `.env.example` before running any bot process.

## Build, Test, and Development Commands

- `bun run dev` — start the TypeScript entry (`src/index.ts`) with ts-node.
- `bun run build` — compile to `dist/` with declarations.
- `bun run start` — run the compiled bot (`dist/index.js`).
- `bun run test` / `bun run test:watch` — execute Jest suites once or in watch mode.
- `bun run lint` / `bun run lint:fix` — apply eslint rules and autofix safe issues.
- `bun run clean` — remove stale build artefacts.

## Coding Style & Naming Conventions

We target Node 18 and strict TypeScript (`tsconfig.json`). Follow the existing two-space indentation, keep semicolons, and mirror `PascalCase` classes, `camelCase` members, and `UPPER_SNAKE_CASE` constants (`src/types/constants.ts`). ESLint enforces explicit return types and bans unused variables; prefer dependency injection and utility loggers over free `console` calls when possible.

## Testing Guidelines

Jest with `ts-jest` drives testing. Place new specs beside the code as `*.spec.ts`/`*.test.ts` or under `__tests__/` in `src/`. Run `bun test -- --coverage` before proposing changes to refresh the `coverage/` report, and mock `SdkRabbitmq` plus `IGlobalMemory` when exercising routing.

## Commit & Pull Request Guidelines

Recent history shows short free-form messages; move toward imperative, scoped lines such as `feat: add dentist scheduling agent`. Keep commits focused, reference issues when present, and note config or schema changes in the body. Pull requests should summarise behaviour changes, list impacted agents/config files, and include the lint/test commands or logs run locally.

## Configuration & Agent Tips

Keep secrets in `.env`, never in git. Update `config/agents.json` whenever you add or reorder an agent, and document the default routing in the same change. Use `scripts/start-dev.sh` for the full local stack and follow it with `scripts/validate-config.sh` after editing routing keys to catch schema drift early.
