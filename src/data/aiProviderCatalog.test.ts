import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { ALL_AI_PROVIDER_IDS, ALL_SUPPORTED_PROVIDERS } from './aiProviderCatalog';

// Extract the server's provider lists from server.ts the same way
// src/lib/aiSettingsRoutes.test.ts extracts handlers — the guard must read the
// real source, not a copy that can drift.
const serverSource = ts.createSourceFile(
  'server.ts',
  readFileSync(new URL('../../server.ts', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);

function stringList(constName: string): string[] {
  for (const stmt of serverSource.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    const decl = stmt.declarationList.declarations[0];
    if (!decl || decl.name.getText(serverSource) !== constName) continue;
    // `const UI_PRIMARY_PROVIDERS = [ ... ] as const` — the array literal is
    // wrapped in an AsExpression; unwrap it to the list.
    let node: ts.Node = decl.initializer as ts.Node;
    while (
      (ts.isAsExpression(node) && node.expression) ||
      (node.kind === ts.SyntaxKind.AsExpression || node.kind === ts.SyntaxKind.TypeAssertionExpression)
    ) {
      node = (node as ts.AsExpression | ts.TypeAssertion).expression;
    }
    if (!ts.isArrayLiteralExpression(node)) return [];
    return node.elements.filter(ts.isStringLiteral).map((el) => (el as ts.StringLiteral).text);
  }
  return [];
}

describe('AI provider catalog client/server parity', () => {
  it('covers every provider the server can list (UI_PRIMARY_PROVIDERS)', () => {
    const serverListed = stringList('UI_PRIMARY_PROVIDERS');
    expect(serverListed.length).toBeGreaterThan(0); // guard: parse worked
    const missing = serverListed.filter((provider) => !ALL_AI_PROVIDER_IDS.has(provider));
    expect(missing, `providers the client would drop on refresh: ${missing.join(', ')}`).toEqual([]);
  });

  it('has no duplicate or empty provider ids (a duplicate breaks the refresh merge)', () => {
    const ids = ALL_SUPPORTED_PROVIDERS.map((p) => p.provider);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });
});
