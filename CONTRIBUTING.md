<![CDATA[# Contributing to SigmaTactix Growth OS

Thank you for your interest in contributing to SigmaTactix Growth OS. This document outlines the process and standards for contributing to the project.

---

## 🚦 Before You Start

1. **Read the architecture**: Familiarize yourself with [`MASTER_CONTEXT.md`](./MASTER_CONTEXT.md) for a full system overview
2. **Learn the language**: Review [`CONTEXT.md`](./CONTEXT.md) for the canonical domain glossary — use the correct terms
3. **Understand the vaults**: The 10-vault Second Brain structure has strict RBAC — know which vaults your changes touch
4. **Check existing work**: Search open issues and PRs before starting new work

---

## 🔀 Branch Naming

| Prefix | Use For | Example |
|---|---|---|
| `feat/` | New features | `feat/social-listening-radar` |
| `fix/` | Bug fixes | `fix/vault-rls-bypass` |
| `refactor/` | Code improvements | `refactor/extract-token-cost-module` |
| `docs/` | Documentation | `docs/update-env-guide` |
| `test/` | Test additions/fixes | `test/agent-pipeline-coverage` |
| `chore/` | Tooling, deps, CI | `chore/upgrade-vite-7` |

---

## 🧪 Development Workflow

### 1. Create a Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature
```

### 2. Write Tests First

Every new `src/lib/` module must ship with a co-located test file:

```
src/lib/myFeature.ts        ← Implementation
src/lib/myFeature.test.ts   ← Tests (required)
```

```bash
# Run tests in watch mode during development
npx vitest --watch
```

### 3. Implement Your Change

- Use TypeScript strict mode — no `any` without justification
- Add Zod schemas for any new API endpoints
- Use `sigma-*` CSS utility classes (never hardcode colors)
- Follow the domain glossary from `CONTEXT.md`

### 4. Verify Before Pushing

```bash
# This must pass before pushing
npm run check
```

This runs:
- `tsc --noEmit` — TypeScript type checking
- `vitest run` — Full test suite

### 5. Commit with Conventional Messages

```
<type>(<scope>): <description>

feat(agents): add DAG cycle detection to agent orchestrator
fix(vault): prevent RLS bypass on credentials vault reads
refactor(token-cost): extract model matching into dedicated module
docs(readme): update environment variable guide
test(vanta): add state machine transition coverage
chore(deps): upgrade React to 19.1
```

### 6. Open a Pull Request

- Target `main`
- Fill in the PR template
- Link related issues
- Request review from a maintainer

---

## 📏 Code Standards

### TypeScript

- Strict mode enabled — avoid `@ts-ignore` and `as any`
- Use Zod for runtime validation at API boundaries
- Prefer explicit return types on exported functions
- Use `type` over `interface` for data shapes unless extending

### React

- Use `React.lazy()` for all page-level route components
- Functional components only — no class components
- Use context providers from `src/contexts/` for shared state
- Keep components focused — extract complex logic to `src/lib/`

### Styling

- Use TailwindCSS v4 with `sigma-*` design tokens
- Never use inline styles or hardcoded color values
- Test both Light and Dark themes before submitting

### Security

- Never import `supabaseAdmin.ts` from client code
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Always scope queries by `workspace_id`
- Use `credentialCrypto.ts` for any credential storage
- Run `verify.sql` if touching database schemas

---

## 🚫 What Not to Submit

- Changes that break `npm run check`
- PRs without tests for new `src/lib/` modules
- Hardcoded API keys or credentials
- Direct modifications to `init.sql` (use a new migration file)
- Components that don't respect the `sigma-*` theme system
- Changes to agent vault access policies without explicit approval

---

## 📝 Pull Request Checklist

Before submitting your PR, confirm:

- [ ] `npm run check` passes (lint + tests)
- [ ] New `src/lib/` modules have co-located `.test.ts` files
- [ ] New API endpoints have Zod validation schemas
- [ ] UI components use `sigma-*` theme tokens
- [ ] No secrets or credentials in the diff
- [ ] Domain glossary terms used correctly
- [ ] Both Light and Dark mode tested (if UI changes)

---

## 📖 Further Reading

- [MASTER_CONTEXT.md](./MASTER_CONTEXT.md) — Full architecture reference
- [CONTEXT.md](./CONTEXT.md) — Domain glossary
- [CHANGELOG.md](./CHANGELOG.md) — Release history
- [backend/TECHNICAL_REQUIREMENTS.md](./backend/TECHNICAL_REQUIREMENTS.md) — Backend specifications

---

_Copyright © 2026 SigmaTactix. All rights reserved._
]]>
