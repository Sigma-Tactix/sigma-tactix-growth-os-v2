import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Deployment smoke test — verifies the production serving block exists in
// server.ts WITHOUT binding a socket (the full server bundle calls
// app.listen at module load, so it cannot be imported here; we static-check
// the source instead). Existing suites already cover /healthz behavior via
// the individual routers; this pins the deployability invariants:
//  - /healthz stays dependency-free and registered before auth
//  - production mode serves dist/ static + SPA fallback, guarded on the
//    build output actually existing (API-only deploys must not 500)
//  - dev mode keeps the Vite middleware path (port 3000 flow unchanged)
//  - unhandled /api/* calls return JSON 404 rather than SPA index.html

// `vitest run` executes from the repo root, so cwd() is the checkout.
const repoRoot = process.cwd();
const source = fs.readFileSync(path.join(repoRoot, 'server.ts'), 'utf8');

describe('deployment smoke (static, no socket)', () => {
  it('registers a dependency-free /healthz and /api/health liveness probe', () => {
    expect(source).toContain('app.get("/healthz"');
    expect(source).toContain('app.get("/api/health"');
    expect(source).toContain('ok: true, uptimeSeconds');
    expect(source).toContain('commit: resolveRuntimeCommitSha()');
  });

  it('registers /readyz and /api/ready readiness probes exposing runtime commit and environment', () => {
    expect(source).toContain('app.get("/readyz"');
    expect(source).toContain('app.get("/api/ready"');
    expect(source).toContain('status: "ready"');
  });

  it('enforces authentication on /api/social mount (C-01 fix)', () => {
    expect(source).toMatch(/app\.use\(\s*["']\/api\/social["'],\s*requireAuth,/);
  });

  it('handles unknown API routes with JSON 404 before SPA catch-all (S04-A1/A2)', () => {
    expect(source).toContain('app.all("/api/*"');
    expect(source).toContain('API endpoint not found');
  });

  it('serves the built SPA in production, guarded on dist/index.html existing', () => {
    // Production branch must not run the Vite dev server.
    expect(source).toMatch(/NODE_ENV !== "production"/);
    // The static block is guarded: only enabled when the build output exists,
    // otherwise the server warns and stays API-only.
    expect(source).toContain('fs.existsSync(path.join(__dirname, "index.html"))');
    expect(source).toContain('express.static(distPath)');
    expect(source).toContain('dist/index.html found');
  });

  it('keeps Vite middleware for non-production dev mode', () => {
    expect(source).toContain('createViteServer');
    expect(source).toContain('vite.middlewares');
  });

  it('has a build + start script that a deploy pipeline can run', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    expect(pkg.scripts.build).toContain('dist/server.js');
    expect(pkg.scripts.start).toBe('node dist/server.js');
  });
});
