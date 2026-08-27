# AGENTS.md — Nevo Contributor Guide for AI Agents

This document is for AI agents contributing to the Nevo repository. Read it fully before making any changes.

---

## What is Nevo?

Nevo is an open-source on-chain donation platform built on the Stellar blockchain. It lets anyone create transparent fundraising pools where every contribution is recorded on-chain and withdrawals are handled by a smart contract — no intermediaries.

**Stack:**
- `nevo_frontend` — Next.js 15 (App Router), Tailwind CSS, Zustand, TypeScript
- `nevo_server` — NestJS, TypeScript (REST API backend)
- `nevo_contract` — Soroban smart contract (Rust), deployed on Stellar

---

## Project Structure

```
Nevo/
├── nevo_frontend/        # Next.js frontend
│   ├── app/              # Pages (App Router)
│   ├── components/       # Shared UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities (api-client, stellar, validation, etc.)
│   └── src/
│       └── store/        # Zustand stores (pools, donations, wallet, ui, theme)
├── nevo_server/          # NestJS backend API
│   └── src/              # Controllers, services, modules
├── nevo_contract/        # Soroban smart contract
│   └── contracts/        # Contract source (Rust)
├── .github/workflows/    # CI (ci.yml) and CD (cd.yml)
└── .husky/               # Git hooks (pre-commit, pre-push)
```

---

## Setup (Do This Once After Cloning)

Run from the **repo root**:

```bash
npm install        # installs Husky and wires up git hooks
```

Then install the deps for your layer:

```bash
# Frontend
cd nevo_frontend && npm install

# Backend
cd nevo_server && npm install

# Contract
cd nevo_contract  # no npm needed — uses cargo
```

Without the root `npm install`, the pre-commit and pre-push hooks will not run, and broken code can be pushed.

---

## Before You Start

**Identify the scope of the task.** Every task belongs to exactly one layer:

| Layer    | Directory        |
|----------|-----------------|
| Frontend | `nevo_frontend/` |
| Backend  | `nevo_server/`   |
| Contract | `nevo_contract/` |

**Never modify multiple layers in a single task.** If your task seems to require cross-layer changes, implement a minimal stub for the dependency (clearly marked with a `// TODO:` comment) and complete only your assigned layer.

---

## How to Navigate the Project

### Frontend (`nevo_frontend/`)
- Pages live in `app/<route>/page.tsx`
- Shared components are in `components/`
- Global state (wallet, pools, donations, theme, UI) is in `src/store/`
- The HTTP client is `lib/api-client.ts` — use `apiClient.get/post/put/delete` for API calls
- Stellar wallet interactions are in `lib/stellar.ts`
- Path alias `@/` maps to the `nevo_frontend/` root (e.g. `@/components/Button`)

### Backend (`nevo_server/`)
- Standard NestJS structure: modules, controllers, services in `src/`
- Currently minimal — a single module. Add feature modules as needed.

### Contract (`nevo_contract/`)
- Soroban (Stellar) smart contract written in Rust
- Source in `contracts/hello-world/src/` (to be expanded)
- Tests are unit tests inside the same file (`#[cfg(test)]` blocks)
- Build target: `wasm32-unknown-unknown`

---

## Validation Checklist — How to Know a Task is Done

Before marking a task complete, verify all of the following for your layer:

### Frontend
- [ ] `npm run build` passes with no errors (run from `nevo_frontend/`)
- [ ] The changed page/component renders correctly and is responsive
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No broken imports (all imported files exist)
- [ ] No hardcoded mock data introduced as a permanent solution

### Backend
- [ ] `npm run build` passes with no errors (run from `nevo_server/`)
- [ ] No TypeScript errors
- [ ] New endpoints follow RESTful conventions and return consistent shapes

### Contract
- [ ] `cargo build --release --target wasm32-unknown-unknown` passes
- [ ] `cargo test --lib` passes — all tests green
- [ ] No unsafe code introduced without justification

---

## What to Push — What Not to Push

### Push
- Source code changes scoped to your assigned layer only
- New or updated tests for contract changes
- Minor copy/label fixes

### Never Push
- `.env` files or any file containing secrets, API keys, or private keys
- `node_modules/`, `target/`, `.next/`, `dist/`, `coverage/` — these are gitignored
- Mock data files or stub implementations that replace real features permanently
- Changes that break the CI (the build must pass before merging)
- Cross-layer changes in a single PR — split them
- Auto-generated AI assistant files (`.kiro/`, `*.kiro`, etc.)
- Unrelated refactors or formatting changes bundled with a feature

---

## Git Hooks (Enforced Locally)

**pre-commit** — runs `lint-staged` on `nevo_frontend/` staged files (ESLint + Prettier auto-fix).

**pre-push** — runs build checks on any package with changed files:
- `nevo_frontend/` changes → `npm run build`
- `nevo_server/` changes → `npm run build`
- `nevo_contract/` changes → `cargo build` + `cargo test --lib`

If a hook fails, fix the issue and push again. Do not bypass hooks with `--no-verify`.

---

## CI (GitHub Actions)

All three jobs must pass on every PR before merging:

| Job | Check |
|-----|-------|
| Frontend — Build | `npm run build` |
| Server — Build | `npm run build` |
| Contract — Build & Test | `cargo build` + `cargo test --lib` |

CD (`cd.yml`) runs on merge to `main` and deploys the frontend to Vercel.

---

## Code Style Rules

- Match the existing patterns in the file you are editing — do not introduce new conventions
- No multi-line comment blocks or verbose JSDoc on internal code
- No `console.log` left in production code
- No features added beyond what the task explicitly requires
- If a dependency from another layer is not yet implemented, create a minimal stub returning hardcoded data and mark it: `// TODO: replace with real implementation`
- Do not remove or rename existing exports without checking all usages

---

## Common Mistakes to Avoid

- **Adding mock/fake implementations as permanent code** — stubs are temporary and must be marked as such
- **Importing from a layer other than your own** — frontend should not import from server source; contract is independent
- **Bundling multiple features in one PR** — keep PRs small and focused
- **Skipping the build check** — if it doesn't build locally, it will fail CI
- **Introducing i18n, analytics, or tracking systems** — these require explicit approval and proper integration before adding

---

## Adding Dependencies

When you add a package to `package.json` you **must** also update the lock file before pushing. Forgetting this breaks CI immediately — `npm ci` refuses to run when `package.json` and `package-lock.json` are out of sync.

**Frontend (`nevo_frontend/`):**
```bash
npm install <package>         # updates both package.json and package-lock.json
npm run build                 # verify it still builds
```

**Backend (`nevo_server/`):**
```bash
npm install <package>         # updates both package.json and package-lock.json
npm run build                 # verify it still builds
```

Always commit `package.json` and `package-lock.json` together in the same commit. Never edit `package.json` manually and push without regenerating the lock file.

### `@stellar/stellar-sdk` API names (v13+)

The project uses `@stellar/stellar-sdk@^13.x`. The namespace was reorganised in v12 — AI training data often references the old names:

| Old (v11 and earlier) | Correct (v12+) |
|---|---|
| `SorobanRpc` | `Soroban` |
| `SorobanRpc.Server` | `Soroban.Server` |
| `SorobanRpc.Api` | `Soroban.Api` |

If the TypeScript compiler says `has no exported member 'SorobanRpc'. Did you mean 'Soroban'?` — use `Soroban`.

### NestJS version compatibility

The server uses **NestJS 11**. Some `@nestjs/*` companion packages have not yet released a v11-compatible version. Always check before installing:

| Package | Minimum version for NestJS 11 |
|---|---|
| `@nestjs/schedule` | `^5.0.0` (not `^4.x`) |
| `@nestjs/typeorm` | `^11.0.0` |
| `@nestjs/jwt` | `^11.0.0` |

If you install a companion package at the wrong major version, `npm install` will warn about a peer dependency conflict. Treat that warning as a hard error — fix the version before pushing.
