#!/usr/bin/env node
/**
 * Produces local M1 evidence from the checked-out source and installed npm
 * packages. It does not infer runtime use from package presence: each component
 * is labelled direct-runtime, direct-development, or transitive-unverified.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const generatedAt = new Date().toISOString();
const reportDir = join(root, 'reports', 'security-inventory');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const directRuntime = new Set(Object.keys(packageJson.dependencies || {}));
const directDevelopment = new Set(Object.keys(packageJson.devDependencies || {}));
const skippedDirectories = new Set(['.git', 'node_modules', 'dist', '.vexp', 'reports']);

function walk(directory, predicate = () => true, entries = []) {
  if (!existsSync(directory)) return entries;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, predicate, entries);
    else if (entry.isFile() && predicate(fullPath)) entries.push(fullPath);
  }
  return entries;
}

function readJsonIfPresent(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

function packageNameFromLockPath(lockPath, metadata) {
  if (metadata?.name) return metadata.name;
  return lockPath.replace(/^node_modules\//, '');
}

function licenseExpression(metadata) {
  const license = metadata?.license;
  if (typeof license === 'string' && license.trim()) return license.trim();
  if (Array.isArray(license)) return license.map((item) => typeof item === 'string' ? item : item?.type).filter(Boolean).join(' OR ') || 'UNKNOWN';
  if (license?.type) return license.type;
  return 'UNKNOWN';
}

function componentUsage(name, lockEntry) {
  if (directRuntime.has(name)) return 'direct-runtime';
  if (directDevelopment.has(name)) return 'direct-development';
  return lockEntry.dev ? 'transitive-development' : 'transitive-unverified';
}

const components = Object.entries(packageLock.packages || {})
  .filter(([lockPath]) => lockPath.startsWith('node_modules/'))
  .map(([lockPath, lockEntry]) => {
    const installedMetadata = readJsonIfPresent(join(root, lockPath, 'package.json'));
    const name = packageNameFromLockPath(lockPath, installedMetadata || lockEntry);
    const version = installedMetadata?.version || lockEntry.version || 'UNKNOWN';
    const usage = componentUsage(name, lockEntry);
    return {
      type: 'library',
      name,
      version,
      purl: version === 'UNKNOWN' ? undefined : `pkg:npm/${name.replace('@', '%40').replace('/', '%2F')}@${version}`,
      licenses: [{ license: { id: licenseExpression(installedMetadata || lockEntry) } }],
      properties: [
        { name: 'sigma:lock-path', value: lockPath },
        { name: 'sigma:usage-status', value: usage },
        { name: 'sigma:resolved', value: String(lockEntry.resolved || 'unknown') },
        { name: 'sigma:integrity', value: String(lockEntry.integrity || 'unknown') },
      ],
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));

function findNestedRepositories() {
  const repositories = [];
  const directories = [root];
  while (directories.length) {
    const directory = directories.pop();
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || skippedDirectories.has(entry.name)) continue;
      const child = join(directory, entry.name);
      if (existsSync(join(child, '.git'))) {
        let revision = 'unavailable';
        try { revision = execFileSync('git', ['-C', child, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* recorded below */ }
        repositories.push({ path: relative(root, child), revision });
        continue;
      }
      directories.push(child);
    }
  }
  return repositories.sort((a, b) => a.path.localeCompare(b.path));
}

const sourceFiles = walk(root, (file) => /\.(?:ts|tsx|js|mjs|cjs|sql|md)$/i.test(file));
const pages = walk(join(root, 'src', 'pages'), (file) => /\.tsx$/i.test(file)).map((file) => relative(root, file));
const apiRoutes = walk(join(root, 'src', 'server', 'routes'), (file) => /\.ts$/i.test(file)).map((file) => relative(root, file));
const skills = walk(join(root, '.agents', 'skills'), (file) => /(?:^|\/)SKILL\.md$/i.test(file)).map((file) => relative(root, file));

const inventory = {
  schemaVersion: '1.0',
  generatedAt,
  scope: {
    repository: packageJson.name,
    lockfileVersion: packageLock.lockfileVersion,
    sourceFiles: sourceFiles.length,
    pages,
    apiRoutes,
    workspaceSkills: skills,
    nestedRepositories: findNestedRepositories(),
  },
  dependencySummary: {
    directRuntime: directRuntime.size,
    directDevelopment: directDevelopment.size,
    lockfilePackagePaths: components.length,
    usageDefinitions: {
      'direct-runtime': 'Declared in dependencies. Presence does not prove a code path executed in production.',
      'direct-development': 'Declared in devDependencies. Presence does not prove it is excluded from deployed tooling.',
      'transitive-unverified': 'Pulled by the lockfile. Actual runtime reachability requires import/build analysis.',
      'transitive-development': 'Marked dev in the lockfile. Validate the deployment boundary separately.',
    },
  },
  components,
  limitations: [
    'This inventory proves checked-out and installed package presence, not runtime reachability or safety.',
    'License values are read from installed package metadata and must be reviewed for exceptions and notices.',
    'Vulnerability, secret, container, IaC, and external-service reviews are separate controls.',
    'External repositories and bookmark sheets require a separate legal and architectural disposition record.',
  ],
};

const bom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  serialNumber: `urn:uuid:${crypto.randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: generatedAt,
    tools: [{ vendor: 'Sigma Tactix', name: 'generateSecurityInventory.mjs', version: '1.0' }],
    component: { type: 'application', name: packageJson.name, version: packageJson.version },
  },
  components,
};

const licenseReport = components.map((component) => ({
  name: component.name,
  version: component.version,
  license: component.licenses[0].license.id,
  usage: component.properties.find((property) => property.name === 'sigma:usage-status')?.value,
  lockPath: component.properties.find((property) => property.name === 'sigma:lock-path')?.value,
}));

mkdirSync(reportDir, { recursive: true });
writeFileSync(join(reportDir, 'component-inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`);
writeFileSync(join(reportDir, 'bom.cdx.json'), `${JSON.stringify(bom, null, 2)}\n`);
writeFileSync(join(reportDir, 'licenses.json'), `${JSON.stringify(licenseReport, null, 2)}\n`);
console.log(`Wrote ${components.length} component records to ${relative(root, reportDir)}`);
