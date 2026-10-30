#!/usr/bin/env node

/**
 * Sigma Tactix Growth OS - Pre-Commit Safety & Security Verification
 * Verifies that:
 * 1. No secret keys or environment credentials are staged for commit.
 * 2. TypeScript compilation passes cleanly (`tsc --noEmit`).
 * 3. Scoped test suites pass (`vitest run`).
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🛡️  Running Sigma Tactix Pre-Commit Safety & Security Checks...\n');

let failed = false;

// 1. Scan staged and modified files for sensitive tokens and keys
console.log('1️⃣  Scanning for credential and secret leaks...');
try {
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' });
  const lines = statusOutput.split('\n').filter(Boolean);

  const blockedPatterns = [
    /\.env$/i,
    /\.env\.local$/i,
    /id_rsa/i,
    /.*\.pem$/i,
    /.*\.key$/i,
  ];

  const suspiciousSecretRegexes = [
    /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
    /ghp_[a-zA-Z0-9]{36}/,
    /gho_[a-zA-Z0-9]{36}/,
    /sk-[a-zA-Z0-9]{48}/,
    /AIza[0-9A-Za-z-_]{35}/,
    /sbp_[a-zA-Z0-9]{40}/,
  ];

  for (const line of lines) {
    const file = line.slice(3).trim();
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;

    // Check filenames
    for (const pattern of blockedPatterns) {
      if (pattern.test(file) && !file.endsWith('.env.example')) {
        console.error(`❌ BLOCKED: Attempting to commit restricted environment file: ${file}`);
        failed = true;
      }
    }

    // Check contents if text file
    if (!file.endsWith('.png') && !file.endsWith('.jpg') && !file.endsWith('.ico') && !file.endsWith('.woff2')) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        for (const regex of suspiciousSecretRegexes) {
          if (regex.test(content)) {
            console.error(`❌ BLOCKED: Potential high-entropy secret detected in ${file}`);
            failed = true;
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  if (!failed) {
    console.log('   ✅ No secrets or sensitive credential files detected.');
  }
} catch (err) {
  console.warn('   ⚠️  Git scan skipped or git not initialized:', err.message);
}

// 2. Run TypeScript compilation check
console.log('\n2️⃣  Verifying TypeScript compilation (`tsc --noEmit`)...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('   ✅ TypeScript check passed.');
} catch {
  console.error('   ❌ TypeScript compilation failed. Fix type errors before committing.');
  failed = true;
}

// 3. Run Test Suite
console.log('\n3️⃣  Running scoped test suite (`npm test`)...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('   ✅ Test suite passed.');
} catch {
  console.error('   ❌ Unit/Integration tests failed.');
  failed = true;
}

if (failed) {
  console.error('\n🚨 Safety check FAILED. Please resolve the blockers above before pushing.\n');
  process.exit(1);
} else {
  console.log('\n✨ All safety and security verification gates PASSED!\n');
  process.exit(0);
}

