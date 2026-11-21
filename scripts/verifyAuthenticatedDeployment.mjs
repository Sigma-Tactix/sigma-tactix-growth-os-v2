// Isolated administrative fixture setup; application checks use user JWTs only.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const origin = new URL(process.argv[2]).origin;
const env = dotenv.parse(fs.readFileSync('.env'));
const config = JSON.parse(fs.readFileSync('supabase-config.json'));
assert.equal(env.SUPABASE_URL, config.url);
if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Administrative fixture credential unavailable');
const admin = createClient(config.url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const prefix = `release-check-${crypto.randomUUID()}`;
const fixtures = [];
const results = [];
let providerReadiness;
let failure;
try {
  for (const label of ['alpha', 'beta']) {
    const password = crypto.randomBytes(32).toString('base64url');
    const email = `${prefix}-${label}@example.invalid`;
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { release_verification_fixture: prefix } });
    if (created.error) throw Object.assign(new Error('Fixture identity setup failed'), { stage: 'fixture-auth', code: created.error.code, status: created.error.status });
    const fixture = { userId: created.data.user.id, workspaceId: null, client: null, token: null };
    fixtures.push(fixture);
    const workspace = await admin.from('workspaces').insert({ name: `${prefix}-${label}`, owner_id: fixture.userId }).select('id').single();
    if (workspace.error) throw Object.assign(new Error('Fixture Client Enclave setup failed'), { stage: 'fixture-enclave', code: workspace.error.code });
    fixture.workspaceId = workspace.data.id;
    fixture.client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const session = await fixture.client.auth.signInWithPassword({ email, password });
    if (session.error) throw Object.assign(new Error('Fixture sign-in failed'), { stage: 'user-sign-in', code: session.error.code, status: session.error.status });
    fixture.token = session.data.session.access_token;
  }
  for (let index = 0; index < fixtures.length; index++) {
    const own = fixtures[index];
    const foreign = fixtures[1 - index];
    const allowed = await fetch(`${origin}/api/workspace`, { headers: { Authorization: `Bearer ${own.token}`, 'x-workspace': own.workspaceId }, signal: AbortSignal.timeout(20000) });
    assert.equal(allowed.status, 200, 'Authenticated own-enclave API read');
    assert.match(allowed.headers.get('content-type'), /application\/json/);
    await allowed.body.cancel();
    if (index === 0) {
      const provider = await fetch(`${origin}/api/workspace/vanta/status`, { headers: { Authorization: `Bearer ${own.token}`, 'x-workspace': own.workspaceId }, signal: AbortSignal.timeout(20000) });
      if (provider.ok) {
        const status = await provider.json();
        providerReadiness = { configured: status.configured === true, verified: status.verified === true, provider: status.provider || null };
      }
    }
    const denied = await fetch(`${origin}/api/workspace`, { headers: { Authorization: `Bearer ${own.token}`, 'x-workspace': foreign.workspaceId }, signal: AbortSignal.timeout(20000) });
    assert.equal(denied.status, 403, 'Foreign-enclave API denial');
    await denied.body.cancel();
    const direct = await own.client.from('workspaces').select('id').eq('id', foreign.workspaceId);
    if (direct.error) throw Object.assign(new Error('User-scoped RLS query failed'), { stage: 'rls-read', code: direct.error.code });
    assert.deepEqual(direct.data, [], 'Foreign-enclave RLS denial');
    results.push({ identity: index + 1, ownEnclaveRead: 'PASS', foreignEnclaveApiDenial: 'PASS', foreignEnclaveRlsDenial: 'PASS' });
  }
} catch (error) {
  failure = { stage: error.stage || 'acceptance', code: error.code || error.name, status: error.status || null, assertion: error.name === 'AssertionError' ? error.message : undefined };
} finally {
  for (const fixture of fixtures.reverse()) {
    if (fixture.workspaceId) {
      const removed = await admin.from('workspaces').delete().eq('id', fixture.workspaceId).eq('owner_id', fixture.userId).like('name', `${prefix}%`);
      if (removed.error) failure = { stage: 'fixture-cleanup-enclave', code: removed.error.code };
    }
    const removedUser = await admin.auth.admin.deleteUser(fixture.userId);
    if (removedUser.error) failure = { stage: 'fixture-cleanup-auth', code: removedUser.error.code };
  }
}
console.log(JSON.stringify({ origin, passed: !failure && results.length === 2, results, providerReadiness, ...(failure ? { failure } : {}), fixtureCleanup: failure?.stage?.startsWith('fixture-cleanup') ? 'FAILED' : 'completed' }, null, 2));
process.exitCode = failure ? 1 : 0;
