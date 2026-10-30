## Description
<!-- Provide a clear, concise summary of the changes and the problem solved. -->

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Security fix / dependency patch
- [ ] Architectural change / refactoring
- [ ] Documentation update

## Verification & Test Evidence

- [ ] `tsc --noEmit` runs with 0 errors
- [ ] `npm test` passes all unit and integration test suites
- [ ] `npm run build` succeeds for both client and server bundles
- [ ] Scoped security routes verified (`npm run inventory:security`)

```text
<!-- Paste verification summary or test results here -->
```

## Security & Safety Checklist

- [ ] **No credentials, tokens, or API secrets** (`.env`, private keys, API tokens) committed.
- [ ] **Authentication & Authorization**: Protected endpoints verify `requireAuth` or appropriate tenant permissions.
- [ ] **Data boundary**: Respects multi-tenant isolation and Row Level Security (RLS).
- [ ] **No AI Slop**: User-facing copy adheres to brand guidelines without AI tropes.

## Linked Issues / Tasks

Closes #
