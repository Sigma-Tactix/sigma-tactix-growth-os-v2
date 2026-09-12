import { ScopedAgent, AgentSkill, SubAgent, LearnedHeuristic } from '@/src/data/agentCockpitData';

/**
 * Converts a ScopedAgent into a structured, standards-compliant .md file
 * including YAML frontmatter and comprehensive system instructions.
 */
export function exportAgentToMarkdown(agent: ScopedAgent): string {
  const frontmatter = [
    '---',
    `id: "${agent.id}"`,
    `name: "${agent.name}"`,
    `codename: "${agent.codename}"`,
    `role: "${agent.role}"`,
    `isOrchestrator: ${agent.isOrchestrator ? 'true' : 'false'}`,
    `status: "${agent.status}"`,
    `accuracyRate: "${agent.accuracyRate}"`,
    `tasksCompleted: ${agent.tasksCompleted}`,
    `lastActive: "${agent.lastActive}"`,
    'readVaults:',
    ...agent.readVaults.map(v => `  - "${v}"`),
    'writeVaults:',
    ...agent.writeVaults.map(v => `  - "${v}"`),
    'blockedVaults:',
    ...agent.blockedVaults.map(v => `  - "${v}"`),
    'requiresHITLFor:',
    ...agent.requiresHITLFor.map(h => `  - "${h}"`),
    'learningMetrics:',
    `  cycleIteration: ${agent.learningProfile.cycleIteration}`,
    `  overallRewardScore: ${agent.learningProfile.overallRewardScore}`,
    `  reflectionCount: ${agent.learningProfile.reflectionCount}`,
    `  temperature: ${agent.learningProfile.temperature}`,
    `  retrievalThreshold: ${agent.learningProfile.retrievalThreshold}`,
    `  voiceVectorAlignment: ${agent.learningProfile.voiceVectorAlignment}`,
    '---'
  ].join('\n');

  const skillsSection = agent.skills.map(skill => {
    return [
      `### Skill: ${skill.name} (\`${skill.id}\`)`,
      `- **Category:** ${skill.category}`,
      `- **Clearance Level:** ${skill.clearanceLevel}`,
      `- **Tool Signature:** \`${skill.toolSignature}\``,
      `- **Success Rate:** ${skill.successRate} (${skill.invocationCount} invocations)`,
      `- **Status:** ${skill.isActive ? 'Active' : 'Disabled'}`,
      `- **Description:** ${skill.description}`,
      ''
    ].join('\n');
  }).join('\n');

  const subAgentsSection = agent.subAgents.map(sub => {
    return [
      `### Sub-Agent: ${sub.name} (\`${sub.codename}\`)`,
      `- **Designated Task:** ${sub.designatedTask}`,
      `- **Specialized Tool:** \`${sub.specializedTool}\``,
      `- **Tasks Completed:** ${sub.tasksCompleted}`,
      `- **Accuracy Rate:** ${sub.accuracy}`,
      `- **Status:** ${sub.status} (Last active: ${sub.lastRunAt})`,
      ''
    ].join('\n');
  }).join('\n');

  const heuristicsSection = agent.learningProfile.heuristics.map(heur => {
    return [
      `- **[${heur.category}]** (Confidence: ${(heur.confidenceScore * 100).toFixed(0)}%, Impact: ${heur.impactDelta})`,
      `  *${heur.rule}* [${heur.status}]`,
      ''
    ].join('\n');
  }).join('\n');

  const md = `${frontmatter}

# ${agent.codename} — ${agent.name}
> ${agent.role}

${agent.description}

---

## 1. System Prompt & Core Instructions

\`\`\`
${agent.instructions.systemPrompt}
\`\`\`

### Operational Directives
${agent.instructions.operationalDirectives.map(d => `- ${d}`).join('\n')}

### Behavioral Constraints
${agent.instructions.behavioralConstraints.map(c => `- ${c}`).join('\n')}

### Guardrails & Safety Thresholds
${agent.instructions.guardrails.map(g => `- ${g}`).join('\n')}

### Output Specification
\`\`\`
${agent.instructions.outputFormat}
\`\`\`

---

## 2. Specialized Skills Matrix
${skillsSection || '*No skills configured.*'}

---

## 3. Designated Task Sub-Agents
${subAgentsSection || '*No sub-agents designated.*'}

---

## 4. Self-Learning Loop & Learned Heuristics
- **Current Cycle Iteration:** #${agent.learningProfile.cycleIteration}
- **Composite Reward Score:** ${agent.learningProfile.overallRewardScore}%
- **Reflection Checkpoints:** ${agent.learningProfile.reflectionCount} runs
- **Dynamic Sampling Parameters:**
  - Temperature: \`${agent.learningProfile.temperature}\`
  - Retrieval Confidence Threshold: \`${agent.learningProfile.retrievalThreshold}\`
  - Voice Vector Alignment: \`${agent.learningProfile.voiceVectorAlignment}%\`

### Distilled Heuristics:
${heuristicsSection || '*No heuristics recorded yet.*'}
`;

  return md;
}

/**
 * Triggers a browser download of the agent definition in .md format
 */
export function downloadAgentMarkdown(agent: ScopedAgent): void {
  const mdContent = exportAgentToMarkdown(agent);
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${agent.codename.toLowerCase()}-agent-definition.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Exports multiple selected agents as a consolidated Markdown bundle
 */
export function downloadMultiAgentBundleMarkdown(agents: ScopedAgent[]): void {
  const header = `# Sigma Tactix Growth OS — Multi-Agent Fleet Bundle
> Generated on ${new Date().toISOString()} • ${agents.length} Autonomous Agents Bundled

This configuration package contains the complete operational definitions, RBAC matrices, skill signatures, sub-agent hierarchies, and self-learning parameters for the selected agents.

## Table of Contents
${agents.map((a, i) => `${i + 1}. [${a.codename} — ${a.name}](#${a.codename.toLowerCase()}-${a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})`).join('\n')}

---
`;

  const body = agents.map(agent => exportAgentToMarkdown(agent)).join('\n\n---\n\n');
  const bundleContent = `${header}\n${body}`;

  const blob = new Blob([bundleContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `sigma-tactix-multi-agent-bundle-${Date.now()}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Parses a markdown string with frontmatter to produce updated agent fields
 */
export function importAgentFromMarkdown(mdContent: string, fallbackAgent?: ScopedAgent): Partial<ScopedAgent> {
  const result: Partial<ScopedAgent> = {
    instructions: fallbackAgent?.instructions ? { ...fallbackAgent.instructions } : {
      systemPrompt: '',
      operationalDirectives: [],
      behavioralConstraints: [],
      guardrails: [],
      outputFormat: ''
    }
  };

  try {
    // 1. Check for YAML frontmatter
    const frontmatterMatch = mdContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (frontmatterMatch) {
      const yaml = frontmatterMatch[1];
      const lines = yaml.split('\n');

      let currentArrayKey: string | null = null;
      const parsedArrays: Record<string, string[]> = {};

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('- ') && currentArrayKey) {
          const val = trimmed.replace(/^-\s*/, '').replace(/^["']|["']$/g, '');
          parsedArrays[currentArrayKey] = parsedArrays[currentArrayKey] || [];
          parsedArrays[currentArrayKey].push(val);
          continue;
        }

        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > -1) {
          const key = trimmed.slice(0, colonIndex).trim();
          const rawValue = trimmed.slice(colonIndex + 1).trim();

          if (!rawValue) {
            currentArrayKey = key;
            continue;
          } else {
            currentArrayKey = null;
          }

          const cleanVal = rawValue.replace(/^["']|["']$/g, '');

          if (key === 'name') result.name = cleanVal;
          if (key === 'codename') result.codename = cleanVal;
          if (key === 'role') result.role = cleanVal;
          if (key === 'status') result.status = cleanVal as any;
          if (key === 'accuracyRate') result.accuracyRate = cleanVal;
          if (key === 'tasksCompleted') result.tasksCompleted = parseInt(cleanVal, 10) || 0;
          if (key === 'isOrchestrator') result.isOrchestrator = cleanVal === 'true';
        }
      }

      if (parsedArrays.readVaults) result.readVaults = parsedArrays.readVaults;
      if (parsedArrays.writeVaults) result.writeVaults = parsedArrays.writeVaults;
      if (parsedArrays.blockedVaults) result.blockedVaults = parsedArrays.blockedVaults;
      if (parsedArrays.requiresHITLFor) result.requiresHITLFor = parsedArrays.requiresHITLFor;
    }

    // 2. Parse System Prompt
    const promptMatch = mdContent.match(/## 1\. System Prompt[\s\S]*?```([\s\S]*?)```/);
    if (promptMatch && promptMatch[1] && result.instructions) {
      result.instructions.systemPrompt = promptMatch[1].trim();
    }

    // 3. Parse Operational Directives
    const directivesMatch = mdContent.match(/### Operational Directives\r?\n([\s\S]*?)(?=###|\n\n##)/);
    if (directivesMatch && directivesMatch[1] && result.instructions) {
      const directives = directivesMatch[1]
        .split('\n')
        .map(l => l.trim().replace(/^-\s*/, ''))
        .filter(l => l.length > 0);
      if (directives.length > 0) {
        result.instructions.operationalDirectives = directives;
      }
    }

    // 4. Parse Behavioral Constraints
    const constraintsMatch = mdContent.match(/### Behavioral Constraints\r?\n([\s\S]*?)(?=###|\n\n##)/);
    if (constraintsMatch && constraintsMatch[1] && result.instructions) {
      const constraints = constraintsMatch[1]
        .split('\n')
        .map(l => l.trim().replace(/^-\s*/, ''))
        .filter(l => l.length > 0);
      if (constraints.length > 0) {
        result.instructions.behavioralConstraints = constraints;
      }
    }

    // 5. Parse Guardrails
    const guardrailsMatch = mdContent.match(/### Guardrails[^\n]*\r?\n([\s\S]*?)(?=###|\n\n##)/);
    if (guardrailsMatch && guardrailsMatch[1] && result.instructions) {
      const guardrails = guardrailsMatch[1]
        .split('\n')
        .map(l => l.trim().replace(/^-\s*/, ''))
        .filter(l => l.length > 0);
      if (guardrails.length > 0) {
        result.instructions.guardrails = guardrails;
      }
    }

    // 6. Parse Output Specification
    const outputMatch = mdContent.match(/### Output Specification\r?\n```([\s\S]*?)```/);
    if (outputMatch && outputMatch[1] && result.instructions) {
      result.instructions.outputFormat = outputMatch[1].trim();
    }

    // 7. Parse Description
    const descMatch = mdContent.match(/# [^\n]+\r?\n> [^\n]+\r?\n\r?\n([\s\S]*?)(?=\r?\n\r?\n---)/);
    if (descMatch && descMatch[1]) {
      result.description = descMatch[1].trim();
    }

    return result;
  } catch (err) {
    console.error('Failed to parse agent markdown:', err);
    return result;
  }
}
