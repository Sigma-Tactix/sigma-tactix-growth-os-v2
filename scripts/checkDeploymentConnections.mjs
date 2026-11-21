// Public routing checks only. Authenticated acceptance still needs a user session.
const args = process.argv.slice(2);
const value = name => args.find(arg => arg.startsWith(`${name}=`))?.slice(name.length + 1);
const target = value('--url');
if (!target) throw new Error('Use --url=https://deployment.example [--commit=sha] [--require-ready]');
const origin = new URL(target).origin;
const expectedCommit = value('--commit');
const probes = [
  ['/api/health', 200, 'json'], ['/healthz', 200, 'json'],
  ['/api/ready', null, 'json'], ['/readyz', null, 'json'],
  ['/api/workspace', 401, 'json'], ['/api/__connection_check_missing__', 404, 'json'],
  ['/dashboard/briefing', 200, 'html'],
];
const results = await Promise.all(probes.map(async ([path, expectedStatus, format]) => {
  try {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(20000), redirect: 'error' });
    const type = response.headers.get('content-type') || '';
    const text = await response.text();
    const body = format === 'json' && type.includes('application/json') ? JSON.parse(text) : null;
    let ok = format === 'json' ? body !== null : type.includes('text/html');
    if (expectedStatus !== null) ok &&= response.status === expectedStatus;
    if (path.endsWith('health') || path === '/healthz') {
      ok &&= body?.ok === true && body?.status === 'alive';
      if (expectedCommit) ok &&= body?.commit === expectedCommit;
    }
    if (path.includes('ready')) {
      ok &&= (body?.ready === true && response.status === 200) || (body?.ready === false && response.status === 503);
      if (expectedCommit) ok &&= body?.commit === expectedCommit;
    }
    return { path, status: response.status, type, ok, ...(body?.commit ? { commit: body.commit } : {}),
      ...(path.includes('ready') ? { ready: body?.ready === true, database: body?.database, workerHealthy: body?.worker?.healthy === true } : {}) };
  } catch {
    return { path, ok: false, error: 'Request failed or response did not match the expected format.' };
  }
}));
const routingPassed = results.every(result => result.ok);
const releaseReady = routingPassed && results.filter(result => result.path.includes('ready')).every(result => result.ready);
console.log(JSON.stringify({ origin, routingPassed, releaseReady, authenticatedAcceptance: 'not_performed', results }, null, 2));
process.exitCode = routingPassed && (!args.includes('--require-ready') || releaseReady) ? 0 : 1;
