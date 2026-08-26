## Summary

<!-- Briefly describe what this PR does and why. -->

## Related Issue

Closes #<!-- issue number -->

## Layer Touched

This PR modifies exactly one layer (per the single-layer-per-PR convention in AGENTS.md):

- [ ] `nevo_frontend` — Next.js frontend
- [ ] `nevo_server` — NestJS backend API
- [ ] `nevo_contract` — Soroban smart contract (Rust)
- [ ] Other (docs, CI, repo config — no source layer changed)

> If your changes span more than one source layer, stop and split this PR.

## Checklist

### All PRs
- [ ] The branch is up to date with `main`
- [ ] No `.env` files, secrets, or API keys are included
- [ ] No auto-generated files (`node_modules/`, `target/`, `.next/`, `dist/`) are committed

### Frontend (`nevo_frontend/`) — if applicable
- [ ] `npm run build` passes locally (run from `nevo_frontend/`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No `MOCK_` constants left in `app/` or `src/store/`
- [ ] New or updated tests added where appropriate

### Backend (`nevo_server/`) — if applicable
- [ ] `npm run build` passes locally (run from `nevo_server/`)
- [ ] No TypeScript errors
- [ ] New endpoints follow RESTful conventions

### Contract (`nevo_contract/`) — if applicable
- [ ] `cargo build --release --target wasm32-unknown-unknown` passes
- [ ] `cargo test --lib` passes — all tests green
- [ ] No unsafe code introduced without justification

## Testing Notes

<!-- Describe how you tested these changes. Include any manual steps or relevant test output. -->
