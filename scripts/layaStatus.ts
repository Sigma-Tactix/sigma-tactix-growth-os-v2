#!/usr/bin/env tsx
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { getDecisionRuntimeStatus, type DecisionRuntimeStatus } from '../src/lib/decisionEngine.js';

export async function checkLayaStatus(): Promise<{ code: number; status: DecisionRuntimeStatus }> {
  const status = await getDecisionRuntimeStatus();
  process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
  if (!status.reachable) {
    process.stderr.write('Laya runtime is offline. Start it with: npm run laya:serve\n');
    return { code: 1, status };
  }
  return { code: 0, status };
}

async function main(): Promise<void> {
  try {
    const { code } = await checkLayaStatus();
    process.exitCode = code;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
