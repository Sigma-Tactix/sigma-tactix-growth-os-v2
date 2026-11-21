type ReadinessOptions = {
  env?: NodeJS.ProcessEnv;
  fetch?: typeof globalThis.fetch;
};

/** Check connectivity without reading Client Enclave data or using a service key. */
export async function assessRuntimeReadiness(options: ReadinessOptions = {}) {
  const env = options.env ?? process.env;
  const request = options.fetch ?? globalThis.fetch;
  let database: 'unconfigured' | 'reachable' | 'unavailable' = 'unconfigured';
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    database = 'unavailable';
    try {
      const url = new URL('/rest/v1/workspaces?select=id&limit=0', env.SUPABASE_URL);
      const response = await request(url, {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
        signal: AbortSignal.timeout(4000),
      });
      const body = await response.json();
      // RLS/grants should deny this anonymous probe. A PostgreSQL permission
      // response proves the database was reached without exposing any rows.
      if (response.status === 401 && body?.code === '42501') database = 'reachable';
    } catch {
      // URLs, headers, and upstream error messages can carry secrets. Do not log them.
    }
  }
  return {
    ready: false,
    status: 'unavailable' as const,
    database,
    databaseVerification: 'connectivity_only',
    worker: {
      configured: false,
      healthy: false,
      detail: 'The current job queue is process-local. Durable execution requires a persistent queue and a supervised worker.',
    },
    environment: env.VERCEL_ENV || env.NODE_ENV || 'development',
    ledgerAuthoritative: env.EXECUTION_LEDGER_AUTHORITATIVE === 'true',
  };
}
