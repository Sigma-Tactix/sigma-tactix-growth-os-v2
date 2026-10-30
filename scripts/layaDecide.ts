#!/usr/bin/env tsx
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { recommendBoundedChoice, type BoundedDecisionOption } from '../src/lib/decisionEngine.js';

interface CliInput {
  question: string;
  context?: string;
  options: BoundedDecisionOption[];
}

function valueAfter(args: string[], index: number, flag: string): string {
  const value = args[index + 1]?.trim();
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

export function parseLayaDecisionArgs(args: string[]): CliInput {
  let question = '';
  let context: string | undefined;
  const options: BoundedDecisionOption[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === '--question') {
      question = valueAfter(args, index, flag);
      index += 1;
    } else if (flag === '--context') {
      context = valueAfter(args, index, flag);
      index += 1;
    } else if (flag === '--option') {
      const raw = valueAfter(args, index, flag);
      const separator = raw.indexOf('=');
      if (separator < 1 || separator === raw.length - 1) {
        throw new Error('--option must use id=description');
      }
      options.push({ id: raw.slice(0, separator).trim(), description: raw.slice(separator + 1).trim() });
      index += 1;
    } else {
      throw new Error(`unknown argument: ${flag}`);
    }
  }

  return { question, context, options };
}

async function main(): Promise<void> {
  try {
    const input = parseLayaDecisionArgs(process.argv.slice(2));
    const result = await recommendBoundedChoice(input);
    process.stdout.write(`${JSON.stringify({ success: result.engine === 'laya', ...result }, null, 2)}\n`);
    if (result.engine !== 'laya') process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
