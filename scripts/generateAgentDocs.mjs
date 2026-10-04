#!/usr/bin/env node
/**
 * Generates the human-readable agent files under `agents/` from the single
 * source of truth, `src/lib/agentRegistry.ts`.
 *
 * Run after changing the registry:  npm run agents:docs
 *
 * Never hand-edit the generated files — edit the registry and regenerate, or
 * `agentRegistry.test.ts` will not catch the drift for you.
 */
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'agents');

// The registry is TypeScript; compile it to a temp ESM module and import it.
const tmp = join(root, 'node_modules', '.agent-registry.generated.mjs');
execFileSync(
  'npx', ['esbuild', join(root, 'src/lib/agentRegistry.ts'), '--bundle', '--platform=node',
    '--format=esm', `--outfile=${tmp}`],
  { stdio: 'inherit', cwd: root },
);
const registry = await import(`file://${tmp}?t=${Date.now()}`);

const banner = '<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->\n<!-- Regenerate with: npm run agents:docs -->\n';

const table = (headers, rows) =>
  `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n` +
  rows.map(r => `| ${r.join(' | ')} |`).join('\n');

function agentFile(agent) {
  const subs = agent.subAgents.map(s =>
    `### ${s.id}\n\n` +
    `**Purpose** — ${s.purpose}\n\n` +
    `| Contract | Value |\n| --- | --- |\n` +
    `| Plane | \`${s.plane}\`${s.plane === 'write' ? ' — **requires human approval**' : ' — autonomous'} |\n` +
    `| Input | ${s.inputContract} |\n` +
    `| Output | ${s.outputContract} |\n` +
    `| Timeout | ${s.timeoutMs} ms |\n` +
    `| Owning agent | ${agent.id} ${agent.name} |\n`);

  return `${banner}---\nid: ${agent.id}\nname: ${agent.name}\ncodename: ${agent.codename}\ntier: 1\nmission: >-\n  ${agent.mission}\ncategories: [${agent.categories.join(', ')}]\nvault_scope: [${agent.vaultScope.join(', ')}]\nentry_sub_agent: ${agent.entrySubAgent}\nsub_agents: [${agent.subAgents.map(s => s.id).join(', ')}]\ntools: [dispatch, ledger, decision-engine]\n---\n\n` +
    `# ${agent.name} (${agent.id})\n\n` +
    `${agent.mission}\n\n` +
    `## Identity\n\n` +
    `- **Codename** — ${agent.codename}\n` +
    `- **Tier** — 1 (owned by VANTA, Master Agent)\n` +
    `- **Entry sub-agent** — \`${agent.entrySubAgent}\`\n` +
    `- **Vault scope** — ${agent.vaultScope.map(v => `\`${v}\``).join(', ')}\n` +
    `- **Categories owned** — ${agent.categories.map(c => `\`${c}\``).join(', ')}\n\n` +
    `> Secret vaults (Executive, Credentials) are blocked for this agent and every\n` +
    `> sub-agent it spawns. A sub-agent inherits this scope and may never widen it.\n\n` +
    `## Sub-agents\n\n${subs.join('\n')}\n\n` +
    `## Operating rules\n\n` +
    `1. This agent plans; it does not execute writes directly.\n` +
    `2. Every task decomposes into the sub-agents above — there is no direct execution path.\n` +
    `3. Write-plane sub-agents park in \`execution_approvals\` until a human approves.\n` +
    `4. No user-visible claim without an \`evidenceContract\` reference or \`simulated: true\`.\n` +
    `5. Fast bounded choices (routing, triage, safety) come from the Laya decision engine;\n` +
    `   it informs, it never authorizes.\n`;
}

function subAgentFile(owner, sub) {
  return `${banner}---\nid: ${sub.id}\nname: ${sub.id}\ntier: 2\nowner: ${owner.id}\nowner_name: ${owner.name}\nplane: ${sub.plane}\nrequires_approval: ${sub.plane === 'write'}\ntimeout_ms: ${sub.timeoutMs}\ntools: [vault-read]\n---\n\n` +
    `# ${sub.id}\n\n**Owned by** — ${owner.id} ${owner.name}\n\n` +
    `## Mission\n\n${sub.purpose}\n\n` +
    table(['Contract', 'Value'], [
      ['Input', sub.inputContract],
      ['Output', sub.outputContract],
      ['Plane', `\`${sub.plane}\``],
      ['Approval', sub.plane === 'write' ? '**Required** — parks until a human approves' : 'Not required'],
      ['Timeout', `${sub.timeoutMs} ms`],
      ['Vault scope', `Inherited from ${owner.id}, minus Executive and Credentials`],
    ]) +
    `\n## Rules\n\n` +
    `1. Do exactly the mission above. No adjacent work.\n` +
    `2. Never widen the inherited vault scope.\n` +
    `3. Emit a \`node_attempt\` on the parent run; never open a run of your own.\n` +
    `4. No user-visible claim without an \`evidenceContract\` reference or \`simulated: true\`.\n` +
    (sub.plane === 'write'
      ? `5. This is a write-plane sub-agent: it produces drafts and internal artifacts only, and parks until a human approves.\n`
      : `5. This is read-plane: it may read inherited vaults but holds no delivery or connector write capability.\n`);
}

const files = {
  'vanta-master.md': `${banner}---\nid: VANTA\nname: VANTA Master Agent\ncodename: VANTA-00\ntier: 0\nmission: >-\n  ${registry.MASTER_AGENT.mission}\nvault_scope: [${registry.MASTER_AGENT.vaultScope.join(', ')}]\nblocked: [${registry.MASTER_AGENT.blocked.join(', ')}]\n---\n\n` +
    `# VANTA — Master Agent\n\n${registry.MASTER_AGENT.mission}\n\n` +
    `## Hard constraints\n\n` +
    `1. **VANTA never executes.** It decomposes and dispatches. Humans approve.\n` +
    `2. **VANTA never writes.** No vault, connector, or ledger write of its own.\n` +
    `3. **VANTA never authorizes.** It explains *why* approval is required; it cannot grant it.\n\n` +
    `> These are deliberate. Granting VANTA execution would make the approval gate\n` +
    `> decorative — the exact failure \`.clinerules\` rule 2 and the execution ledger exist\n` +
    `> to prevent. Master does not mean omnipotent.\n\n` +
    `## Owned agents\n\n` +
    table(['ID', 'Agent', 'Codename', 'Categories'], registry.SYSTEM_AGENTS.map(a =>
      [a.id, a.name, a.codename, a.categories.map(c => `\`${c}\``).join(' ')])) +
    `\n## Dispatch flow\n\n\`\`\`text\n` +
    `classifyCategory()  -> category -> owning agent (CATEGORY_OWNERS, never model-chosen)\n` +
    `classifyActionRisk() -> risk + HITL for the run\n` +
    `                    -> decompose into the owner's sub-agents\n` +
    `                    -> materialise BoundedWorkflowGraph nodes\n` +
    `                    -> read-plane runs; write-plane parks for approval\n` +
    `                    -> narrate outcomes from the ledger\n\`\`\`\n\n` +
    `## Vault visibility\n\n` +
    `Metadata only: ${registry.MASTER_AGENT.vaultScope.join(', ')}\n\n` +
    `Blocked always: ${registry.MASTER_AGENT.blocked.join(', ')}\n`,
};

for (const agent of registry.SYSTEM_AGENTS) {
  files[`${agent.id.toLowerCase()}-${agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.md`] = agentFile(agent);
  for (const sub of agent.subAgents) files[`sub-agents/${agent.id.toLowerCase()}-${sub.id}.md`] = subAgentFile(agent, sub);
}

// Clear stale output first, then write. Removing afterwards would delete the
// files this run just produced.
if (existsSync(join(outDir, 'sub-agents'))) rmSync(join(outDir, 'sub-agents'), { recursive: true, force: true });

for (const [rel, content] of Object.entries(files)) {
  const full = join(outDir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
const total = registry.SYSTEM_AGENTS.reduce((n, a) => n + a.subAgents.length, 0);
console.log(`Generated 1 master + ${registry.SYSTEM_AGENTS.length} agents + ${total} sub-agents into agents/`);
