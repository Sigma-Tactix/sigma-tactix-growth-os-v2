// Host capability check only. It does not start a worker or certify durable execution.
import fs from 'node:fs';
import cp from 'node:child_process';
import { chromium } from 'playwright';
const docker = cp.spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], { encoding: 'utf8', timeout: 15000, windowsHide: true });
const report = { checkedAt: new Date().toISOString(), scope: 'existing_computer_pilot_host', nodeVersion: process.version, dockerVersion: docker.status === 0 ? docker.stdout.trim() : null, browser: null, isolatedContexts: false, publicPageLoaded: false, browserTeardown: false, supervisedWorkerRunning: false, durableExecutionCertified: false };
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  report.browser = browser.version();
  const first = await browser.newContext();
  const second = await browser.newContext();
  await first.addCookies([{ name: 'pilot-isolation-canary', value: 'test-only', domain: 'example.com', path: '/', secure: true }]);
  report.isolatedContexts = (await first.cookies('https://example.com')).some(cookie => cookie.name === 'pilot-isolation-canary') && !(await second.cookies('https://example.com')).some(cookie => cookie.name === 'pilot-isolation-canary');
  const page = await second.newPage();
  const response = await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 25000 });
  report.publicPageLoaded = response?.status() === 200 && await page.title() === 'Example Domain';
  fs.mkdirSync('build/pilot-host', { recursive: true });
  await page.screenshot({ path: 'build/pilot-host/browser-check.png' });
  await first.close(); await second.close();
} catch (error) { report.error = error.name; }
finally { if (browser) { await browser.close(); report.browserTeardown = true; } }
report.hostCheckPassed = Number(process.versions.node.split('.')[0]) >= 24 && Boolean(report.dockerVersion) && report.isolatedContexts && report.publicPageLoaded && report.browserTeardown;
fs.mkdirSync('docs/verification', { recursive: true });
fs.writeFileSync('docs/verification/pilot-host-2026-11-21.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.hostCheckPassed ? 0 : 1;
