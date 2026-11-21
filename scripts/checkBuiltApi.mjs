import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Unlabeled sample layouts must not be registered in the production client.
for (const file of fs.readdirSync('dist/assets').filter(name => name.endsWith('.js'))) {
  const content = fs.readFileSync(path.join('dist/assets', file), 'utf8');
  for (const route of ['/dashboard/briefing', '/dashboard/command', '/dashboard/progress']) {
    assert.equal(content.includes(route), false, `Development-only dashboard route leaked into ${file}`);
  }
}

// Run under stock Node, outside Vitest/Vite's permissive module resolver.
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_ANON_KEY;
const { default: app } = await import('../api/gateway.mjs');
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const [path, status] of [['/api/health', 200], ['/api/ready', 503], ['/api/workspace', 401], ['/api', 404], ['/api/__built_check_missing__', 404]]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, status, path);
    assert.match(response.headers.get('content-type') || '', /application\/json/, path);
    const body = await response.json();
    if (path === '/api/health') assert.equal(body.status, 'alive');
    if (path === '/api/ready') assert.equal(body.ready, false);
  }
  console.log('Production client route isolation and built Vercel API: five HTTP checks passed.');
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
