// Built-candidate UI checks with a disposable Client Enclave. No external writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import cp from 'node:child_process';
import dotenv from 'dotenv';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

if (!process.argv[2]) throw new Error('Pass the owner-authorized fixture environment file path. Values are never logged.');
const env = dotenv.parse(fs.readFileSync(process.argv[2]));
const config = JSON.parse(fs.readFileSync('supabase-config.json'));
if (env.SUPABASE_URL !== config.url || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Fixture configuration unavailable or inconsistent.');
const authOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(config.url, env.SUPABASE_SERVICE_ROLE_KEY, authOptions);
const marker = `ui-check-${crypto.randomUUID()}`;
let userId, workspaceId, browser, server, failure;
const results = [];
const connectivity = process.argv.includes('--connectivity');
const builtApiSha256 = crypto.createHash('sha256').update(fs.readFileSync('build/server.mjs')).digest('hex');
let cleanup = true;
try {
  const password = crypto.randomBytes(32).toString('base64url');
  const email = `${marker}@example.invalid`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { ui_acceptance_fixture: marker } });
  if (created.error) throw new Error('fixture_identity_setup');
  userId = created.data.user.id;
  const workspace = await admin.from('workspaces').insert({ name: marker, owner_id: userId, tier: 'enterprise' }).select('id').single();
  if (workspace.error) throw new Error('fixture_enclave_setup');
  workspaceId = workspace.data.id;
  const userClient = createClient(config.url, config.anonKey, authOptions);
  const login = await userClient.auth.signInWithPassword({ email, password });
  if (login.error || !login.data.session) throw new Error('fixture_login');

  process.env.VERCEL = '1'; process.env.NODE_ENV = 'production';
  process.env.SUPABASE_URL = config.url; process.env.SUPABASE_ANON_KEY = config.anonKey;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { default: api } = await import('../api/gateway.mjs');
  const host = express();
  host.use(api); host.use(express.static(path.resolve('dist')));
  host.get('*', (_req, res) => res.sendFile(path.resolve('dist/index.html')));
  server = host.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  if (connectivity) {
    let nextApiRequestAt = 0;
    await context.route('**/api/**', async route => {
      const scheduled = Math.max(Date.now(), nextApiRequestAt);
      nextApiRequestAt = scheduled + 650;
      await new Promise(resolve => setTimeout(resolve, Math.max(0, scheduled - Date.now())));
      await route.continue().catch(() => {});
    });
  }
  const key = `sb-${new URL(config.url).hostname.split('.')[0]}-auth-token`;
  await context.addInitScript(({ key, session, workspaceId }) => {
    localStorage.setItem(key, JSON.stringify(session));
    localStorage.setItem('sigmatactix_current_workspace_id', workspaceId);
    localStorage.setItem('sigmatactix-appearance', 'system');
  }, { key, session: login.data.session, workspaceId });
  const page = await context.newPage();
  let pageErrors = [];
  let apiFailures = [];
  page.on('response', response => {
    const target = new URL(response.url());
    if (target.origin === origin && target.pathname.startsWith('/api/') && response.status() >= 400) apiFailures.push({ path: target.pathname, status: response.status() });
  });
  page.on('pageerror', error => pageErrors.push(error.name));
  const hubs = ['creative', 'social', 'search', 'demand', 'paid', 'intelligence', 'attribution'];
  const cases = [];
  for (const hub of hubs) {
    await page.goto(`${origin}/suite/${hub}`, { waitUntil: 'domcontentloaded' });
    await page.locator('main').first().waitFor();
    await page.locator('[aria-label^="Loading "]').first().waitFor({ state: 'hidden', timeout: 30000 });
    const tabs = page.getByRole('tablist').first().getByRole('tab');
    const count = await tabs.count();
    if (hub === 'attribution' || count === 0) cases.push({ hub, url: `/suite/${hub}` });
    else for (let index = 0; index < count; index++) {
      await tabs.nth(index).click();
      await page.locator('[aria-label^="Loading "]').first().waitFor({ state: 'hidden', timeout: 30000 });
      cases.push({ hub, url: new URL(page.url()).pathname + new URL(page.url()).search });
    }
  }
  for (const route of ['agents', 'scheduler', 'reports', 'explorer', 'learnings', 'living-system', 'data-sources', 'agent-reach', 'architecture', 'tenants', 'harness', 'models', 'prompts', 'skills', 'cron']) cases.push({ hub: route, url: `/${route}` });
  for (const theme of (connectivity ? ['light'] : ['light', 'dark'])) for (const width of (connectivity ? [1280] : [1280, 390])) {
    await page.emulateMedia({ colorScheme: theme }); await page.setViewportSize({ width, height: 900 });
    for (const item of cases) {
      pageErrors = []; apiFailures = [];
      await page.goto(origin + item.url, { waitUntil: 'domcontentloaded' });
      await page.locator('main').first().waitFor();
      await page.locator('[aria-label^="Loading "]').first().waitFor({ state: 'hidden', timeout: 30000 });
      let networkSettled = true;
      if (connectivity) {
        try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch { networkSettled = false; }
      } else await page.waitForTimeout(300);
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        theme: document.documentElement.dataset.theme,
        headingCount: document.querySelectorAll('main h1, main h2').length,
        buttonCount: document.querySelectorAll('main button').length,
        boundaryError: /Unexpected Application Error|Something went wrong|Cannot read properties/.test(document.querySelector('main')?.textContent || ''),
      }));
      results.push({ ...item, width, theme, ...state, apiFailures: [...apiFailures], networkSettled, pageErrorCount: pageErrors.length,
        passed: !state.overflow && !state.boundaryError && pageErrors.length === 0 && state.headingCount > 0 && (!connectivity || (networkSettled && apiFailures.length === 0)),
        actionExecution: 'not_performed_by_navigation_check' });
    }
  }
} catch (error) { failure = { stage: error.message?.startsWith('fixture_') ? error.message : 'ui_acceptance', code: error.name, detail: String(error.message || '').split('\n')[0].slice(0, 200) }; }
finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  if (workspaceId) {
    const removed = await admin.from('workspaces').delete().eq('id', workspaceId).eq('owner_id', userId).eq('name', marker);
    if (removed.error) cleanup = false;
  }
  if (userId) { const removed = await admin.auth.admin.deleteUser(userId); if (removed.error) cleanup = false; }
}
const report = { scope: connectivity ? 'built_candidate_module_render_api_connectivity' : 'built_candidate_module_navigation_and_layout', sourceCommit: cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), includesUncommittedChanges: true, builtApiSha256, checkedAt: new Date().toISOString(), results,
  fixtureCleanup: cleanup ? 'completed' : 'FAILED', ...(failure ? { failure } : {}),
  passed: !failure && cleanup && results.length > 0 && results.every(row => row.passed) };
fs.mkdirSync('docs/verification', { recursive: true });
fs.writeFileSync(`docs/verification/${connectivity ? 'module-api-render' : 'module-ui'}-2026-11-21.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ views: results.length, failed: results.filter(row => !row.passed).length, fixtureCleanup: report.fixtureCleanup, failure }));
process.exitCode = report.passed ? 0 : 1;
