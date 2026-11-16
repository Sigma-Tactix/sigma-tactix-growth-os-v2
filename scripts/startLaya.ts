#!/usr/bin/env tsx
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function buildLayaRuntimeEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (!env.LAYA_API_KEY?.trim()) {
    throw new Error('LAYA_API_KEY is required in .env or the shell; refusing to start an unauthenticated runtime.');
  }
  const homeLocalBin = env.HOME ? `${env.HOME}/.local/bin` : '';
  const currentPath = env.PATH || '';
  const path = homeLocalBin && !currentPath.split(':').includes(homeLocalBin)
    ? `${homeLocalBin}:${currentPath}`
    : currentPath;

  return {
    ...env,
    PATH: path,
    LAYA_HOST: '127.0.0.1',
    LAYA_PRELOAD: '1',
  };
}

export async function startLaya(env: NodeJS.ProcessEnv = process.env): Promise<number> {
  const child = spawn('laya-serve', ['--port', '8000'], {
    env: buildLayaRuntimeEnv(env),
    stdio: 'inherit',
  });
  return await new Promise<number>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
}

async function main(): Promise<void> {
  try {
    process.exitCode = await startLaya();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
