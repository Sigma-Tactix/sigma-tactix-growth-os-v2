import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Reads env lazily (not at module load) — server.ts calls dotenv.config()
// after its imports, and ES module imports evaluate before the importing
// file's own body runs, so a module-level read here would always see undefined.
function getConfig(): { url: string; anonKey: string } {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY are not set — see .env.example."
    );
  }
  return { url, anonKey };
}

let cachedClient: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!cachedClient) {
    const { url, anonKey } = getConfig();
    cachedClient = createClient(url, anonKey);
  }
  return cachedClient;
}

// Verifying a session token only needs the project URL + anon key (both
// public, same as the client uses) — asks Supabase's Auth server "whose
// token is this", no service-role secret required.
export async function verifySupabaseToken(token: string) {
  const { data, error } = await getClient().auth.getUser(token);
  if (error || !data.user) {
    throw error || new Error("Invalid session token");
  }
  return data.user;
}

// Per-request client that carries the caller's JWT on every PostgREST call, so
// Row-Level Security runs as that user — the DB itself enforces tenant
// isolation. No service-role secret involved; a bug in app code can't leak
// another workspace's rows because Postgres rejects the read.
export function supabaseForToken(token: string): SupabaseClient {
  const { url, anonKey } = getConfig();
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Unauthenticated client for the intake-completion public routes (#14) — no
// Bearer token, executes PostgREST calls as the `anon` Postgres role. Only
// ever used to call the two narrow SECURITY DEFINER RPCs
// (get_intake_token_info / complete_intake_token) granted to anon in
// 0005_intake_tokens.sql — never for direct table access. Still no
// service-role secret anywhere in this app.
let cachedPublicClient: SupabaseClient | null = null;
export function getPublicClient(): SupabaseClient {
  if (!cachedPublicClient) {
    const { url, anonKey } = getConfig();
    cachedPublicClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return cachedPublicClient;
}

// Narrow, deliberate exception to "no service-role key anywhere" — added
// after an adversarial review caught that apply_stripe_webhook_update()
// (0007_billing.sql), being SECURITY DEFINER and GRANTed to anon, was
// directly callable by anyone holding the public anon key via PostgREST,
// completely bypassing server.ts's Stripe HMAC signature check. The
// intake_tokens/complete_intake_token anon-RPC pattern this was modeled on
// is safe because the token argument itself IS an unguessable, single-use
// secret; a Stripe customer id is just an identifier (readable by the owning
// workspace member via the normal `workspaces` row) — not a capability
// token, so the same pattern doesn't hold here. Fix: the RPC's anon grant
// was revoked and re-granted to service_role only (migration 0008); this
// client is used exclusively inside the already-signature-verified
// /api/webhooks/stripe handler, never anywhere request-triggered by a user.
function getServiceRoleConfig(): { url: string; serviceRoleKey: string } {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey || serviceRoleKey.startsWith("MY_")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured — Stripe webhook billing updates cannot be applied.");
  }
  return { url, serviceRoleKey };
}

let cachedServiceRoleClient: SupabaseClient | null = null;
export function getServiceRoleClient(): SupabaseClient {
  if (!cachedServiceRoleClient) {
    const { url, serviceRoleKey } = getServiceRoleConfig();
    cachedServiceRoleClient = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return cachedServiceRoleClient;
}
