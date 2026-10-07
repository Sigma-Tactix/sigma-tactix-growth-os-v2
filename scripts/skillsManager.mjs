#!/usr/bin/env node
/**
 * SigmaTactix Growth OS — Skills Manager & Search CLI
 *
 * Usage:
 *   node scripts/skillsManager.mjs search <query>
 *   node scripts/skillsManager.mjs list
 *   node scripts/skillsManager.mjs restore <skill-name>
 *   node scripts/skillsManager.mjs archive <skill-name>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const activeDir = path.join(rootDir, '.agents', 'skills');
const archiveDir = path.join(rootDir, '.agents', 'skills-archive');
const catalogFile = path.join(rootDir, '.agents', 'skills-catalog.json');

function ensureDirectories() {
  if (!fs.existsSync(activeDir)) fs.mkdirSync(activeDir, { recursive: true });
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
}

function parseSkill(basePath, id, status) {
  const skillFile = path.join(basePath, id, 'SKILL.md');
  let name = id;
  let description = '';
  let body = '';

  if (fs.existsSync(skillFile)) {
    const raw = fs.readFileSync(skillFile, 'utf8');
    const match = raw.match(/^---\n([\s\S]*?)\n---([\s\S]*)$/);
    if (match) {
      const frontmatter = match[1];
      body = match[2].trim();
      const descMatch = frontmatter.match(/description:\s*([^\n]+(\n\s+[^\n]+)*)/);
      if (descMatch) description = descMatch[1].replace(/\n\s+/g, ' ').trim();
      const nameMatch = frontmatter.match(/name:\s*([^\n]+)/);
      if (nameMatch) name = nameMatch[1].trim();
    } else {
      body = raw;
    }
  }

  description = description.replace(/^["\>]\s*/, '').replace(/["\>]$/, '').trim();

  return {
    id,
    name,
    status,
    description: description || 'No description provided.',
    body,
    path: path.relative(rootDir, path.join(basePath, id)),
  };
}

function getAllSkills() {
  ensureDirectories();
  const active = fs.readdirSync(activeDir)
    .filter(d => fs.statSync(path.join(activeDir, d)).isDirectory())
    .map(id => parseSkill(activeDir, id, 'ACTIVE'));

  const archived = fs.readdirSync(archiveDir)
    .filter(d => fs.statSync(path.join(archiveDir, d)).isDirectory())
    .map(id => parseSkill(archiveDir, id, 'ARCHIVED'));

  return [...active, ...archived];
}

function searchSkills(query) {
  if (!query || !query.trim()) {
    console.log('\n❌ Please provide a search query: npm run skills:search <query>\n');
    process.exit(1);
  }

  const cleanQuery = query.trim().toLowerCase();
  const all = getAllSkills();

  const results = all.filter(s => {
    return s.id.toLowerCase().includes(cleanQuery) ||
      s.name.toLowerCase().includes(cleanQuery) ||
      s.description.toLowerCase().includes(cleanQuery) ||
      s.body.toLowerCase().includes(cleanQuery);
  });

  console.log(`\n🔍 Found ${results.length} skills matching "${query}":\n`);
  if (results.length === 0) {
    console.log('  No matching skills found in active or archived catalogs.');
    console.log('  Run "npm run skills:list" to view all available skills.\n');
    return;
  }

  results.forEach(s => {
    const isAct = s.status === 'ACTIVE';
    const statusTag = isAct ? '\x1b[32m[ACTIVE]\x1b[0m' : '\x1b[33m[ARCHIVED]\x1b[0m';
    console.log(`${statusTag} \x1b[1m${s.id}\x1b[0m — ${s.name}`);
    console.log(`  \x1b[90mLocation: ${s.path}\x1b[0m`);
    console.log(`  ${s.description}`);
    if (!isAct) {
      console.log(`  👉 \x1b[36mRestore with: npm run skills:restore ${s.id}\x1b[0m`);
    } else {
      console.log(`  📦 \x1b[90mArchive with: npm run skills:archive ${s.id}\x1b[0m`);
    }
    console.log('');
  });
}

function listSkills() {
  const all = getAllSkills();
  const active = all.filter(s => s.status === 'ACTIVE');
  const archived = all.filter(s => s.status === 'ARCHIVED');

  console.log('\n======================================================');
  console.log(`  SIGMATACTIX GROWTH OS — SKILLS REGISTRY (${all.length} Total)`);
  console.log('======================================================\n');

  console.log(`\x1b[32m● ACTIVE SKILLS (${active.length})\x1b[0m — Kept in context for active workflows:\n`);
  active.forEach(s => {
    console.log(`  • \x1b[1m${s.id}\x1b[0m: ${s.description.slice(0, 95)}${s.description.length > 95 ? '...' : ''}`);
  });

  console.log(`\n\x1b[33m● ARCHIVED SKILLS (${archived.length})\x1b[0m — Preserved & searchable (not in agent context):\n`);
  archived.forEach(s => {
    console.log(`  • \x1b[1m${s.id}\x1b[0m: ${s.description.slice(0, 85)}${s.description.length > 85 ? '...' : ''}`);
    console.log(`    \x1b[36mRestore command:\x1b[0m npm run skills:restore ${s.id}`);
  });

  console.log('\nSearch anytime: \x1b[36mnpm run skills:search <keyword>\x1b[0m\n');
}

function restoreSkill(name) {
  if (!name) {
    console.log('\n❌ Please specify skill name: npm run skills:restore <name>\n');
    process.exit(1);
  }
  const clean = name.trim();
  const src = path.join(archiveDir, clean);
  const dest = path.join(activeDir, clean);

  if (!fs.existsSync(src)) {
    if (fs.existsSync(dest)) {
      console.log(`\nℹ️ Skill "${clean}" is already ACTIVE in .agents/skills/${clean}\n`);
      return;
    }
    console.log(`\n❌ Skill "${clean}" not found in archived directory (${archiveDir}).\n`);
    process.exit(1);
  }

  fs.renameSync(src, dest);
  console.log(`\n✅ Successfully restored skill: \x1b[32m${clean}\x1b[0m`);
  console.log(`   Moved: ${src} -> ${dest}`);
  console.log(`   Skill is now ACTIVE and available to agents in the workspace.\n`);
}

function archiveSkill(name) {
  if (!name) {
    console.log('\n❌ Please specify skill name: npm run skills:archive <name>\n');
    process.exit(1);
  }
  const clean = name.trim();
  const src = path.join(activeDir, clean);
  const dest = path.join(archiveDir, clean);

  if (!fs.existsSync(src)) {
    if (fs.existsSync(dest)) {
      console.log(`\nℹ️ Skill "${clean}" is already ARCHIVED in .agents/skills-archive/${clean}\n`);
      return;
    }
    console.log(`\n❌ Skill "${clean}" not found in active directory (${activeDir}).\n`);
    process.exit(1);
  }

  fs.renameSync(src, dest);
  console.log(`\n📦 Successfully archived skill: \x1b[33m${clean}\x1b[0m`);
  console.log(`   Moved: ${src} -> ${dest}`);
  console.log(`   Skill is now ARCHIVED and removed from agent context (still fully searchable).\n`);
}

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'search':
    searchSkills(args.join(' '));
    break;
  case 'list':
    listSkills();
    break;
  case 'restore':
    restoreSkill(args[0]);
    break;
  case 'archive':
    archiveSkill(args[0]);
    break;
  default:
    console.log('\nSigmaTactix Skills Manager');
    console.log('Commands:');
    console.log('  node scripts/skillsManager.mjs search <query>');
    console.log('  node scripts/skillsManager.mjs list');
    console.log('  node scripts/skillsManager.mjs restore <skill-name>');
    console.log('  node scripts/skillsManager.mjs archive <skill-name>\n');
}
