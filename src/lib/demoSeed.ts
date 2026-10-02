/**
 * Demo-seed gate for client-side fixtures (Phase 0).
 *
 * A fresh tenant must start from a genuinely empty workspace: seeded rows that
 * read as real work ("Today, 07:01", three completed deliveries) are fabricated
 * claims, which the remediation plan bans from an operational screen.
 *
 * This mirrors the server's `SEED_DEMO_WORKSPACE` switch (workspaceStore.ts) so
 * one deliberate flag governs both sides — a sales demo environment keeps the
 * fixtures, and an environment a client logs into never sees them.
 */
export function isDemoSeedEnabled(rawValue?: string): boolean {
  let value = rawValue;
  if (value === undefined) {
    try {
      // Bracket access on purpose: a literal `import.meta.env.VITE_X` is
      // statically replaced by the bundler, which would make this untestable
      // and impossible to reason about at runtime.
      const env = (import.meta as any)?.env ?? {};
      value = env["VITE_SEED_DEMO_WORKSPACE"];
    } catch {
      // Non-Vite environments (plain node/SSR) have no env; default to no seeds.
      value = undefined;
    }
  }
  return value === 'true';
}