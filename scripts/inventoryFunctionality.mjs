// Static route inventory only. Discovery never counts as runtime verification.
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import ts from 'typescript';

const files = cp.execFileSync('git', ['ls-files', 'server.ts', 'src/server/routes'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(f => f.endsWith('.ts') && !f.includes('.test.'));
const sources = new Map(files.map(file => [file, ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)]));
const server = sources.get('server.ts');
const imports = new Map();
for (const statement of server.statements) {
  if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
  const module = statement.moduleSpecifier.text;
  if (!module.startsWith('.')) continue;
  const file = path.posix.normalize(module.replace(/^\.\//, '').replace(/\.js$/, '.ts'));
  for (const binding of statement.importClause?.namedBindings?.elements || []) imports.set(binding.name.text, file);
}
const prefixes = new Map();
function walk(node, callback) { callback(node); ts.forEachChild(node, child => walk(child, callback)); }
function strings(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
  return ts.isArrayLiteralExpression(node) ? node.elements.flatMap(strings) : [];
}
walk(server, node => {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression) || node.expression.name.text !== 'use') return;
  if (node.expression.expression.getText(server) !== 'app' || !node.arguments.length) return;
  const mounted = strings(node.arguments[0]);
  for (const arg of node.arguments.slice(1)) {
    if (!ts.isCallExpression(arg) || !ts.isIdentifier(arg.expression)) continue;
    const file = imports.get(arg.expression.text);
    if (file) prefixes.set(file, [...new Set([...(prefixes.get(file) || []), ...mounted])]);
  }
});
const routes = [];
const unresolved = [];
for (const [file, source] of sources) {
  walk(source, node => {
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return;
    const method = node.expression.name.text.toUpperCase();
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'ALL'].includes(method)) return;
    if (!['app', 'router'].includes(node.expression.expression.getText(source))) return;
    const paths = node.arguments.length ? strings(node.arguments[0]) : [];
    if (!paths.length) { unresolved.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1, reason: 'dynamic_route_path' }); return; }
    const mounts = file === 'server.ts' ? [''] : prefixes.get(file);
    const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    if (!mounts?.length) { unresolved.push({ file, line, method, paths, reason: 'mount_requires_manual_review' }); return; }
    for (const prefix of mounts) for (const route of paths) {
      const fullPath = `${prefix}/${route}`.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
      routes.push({ id: `${method} ${fullPath}`, method, path: fullPath, file, line,
        verification: 'untested', sourceDiscovery: 'typescript_ast',
        executionPolicy: method === 'GET' ? 'review_before_live_probe' : 'isolated_fixture_or_specific_external_approval_required' });
    }
  });
}
routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
const result = { generatedAt: new Date().toISOString(), sourceCommit: cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), includesUncommittedChanges: true, scope: 'static_express_routes', runtimeCertification: false, routeCount: routes.length, unresolvedMountCount: unresolved.length, routes, unresolved };
fs.mkdirSync('docs/verification', { recursive: true });
fs.writeFileSync('docs/verification/functionality-inventory.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ routeCount: routes.length, unresolvedMountCount: unresolved.length, runtimeCertification: false }));
