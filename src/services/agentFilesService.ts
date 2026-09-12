import { ScopedAgent, AgentSkill, AgentConfigFile } from '@/src/data/agentCockpitData';
import { exportAgentToMarkdown, importAgentFromMarkdown } from './agentMarkdownService';

/**
 * Generate standard set of configuration & instruction files for any ScopedAgent
 */
export function generateDefaultAgentFiles(agent: ScopedAgent): AgentConfigFile[] {
  const files: AgentConfigFile[] = [
    {
      id: `${agent.id}-file-spec`,
      name: 'AGENT_SPEC.md',
      fileType: 'SPEC',
      format: 'markdown',
      description: 'Complete Agent Specification with YAML frontmatter, RBAC vault bindings, and system telemetry.',
      content: exportAgentToMarkdown(agent),
      isSystemFile: true,
      lastModified: agent.lastActive || 'Just now',
      sizeBytes: new Blob([exportAgentToMarkdown(agent)]).size
    },
    {
      id: `${agent.id}-file-prompt`,
      name: 'SYSTEM_PROMPT.md',
      fileType: 'PROMPT',
      format: 'markdown',
      description: 'Primary system instructions, persona definition, operational objectives, and reasoning mode.',
      content: `# ${agent.codename} — System Prompt\n\n${agent.instructions.systemPrompt}`,
      isSystemFile: true,
      lastModified: 'Just now',
      sizeBytes: new Blob([agent.instructions.systemPrompt]).size
    },
    {
      id: `${agent.id}-file-directives`,
      name: 'DIRECTIVES.json',
      fileType: 'DIRECTIVES',
      format: 'json',
      description: 'Actionable execution directives and expected output schema formatting rules.',
      content: JSON.stringify(
        {
          agentCodename: agent.codename,
          operationalDirectives: agent.instructions.operationalDirectives,
          outputFormat: agent.instructions.outputFormat
        },
        null,
        2
      ),
      isSystemFile: true,
      lastModified: 'Just now',
      sizeBytes: 0
    },
    {
      id: `${agent.id}-file-constraints`,
      name: 'BEHAVIORAL_CONSTRAINTS.json',
      fileType: 'DIRECTIVES',
      format: 'json',
      description: 'Negative constraints, stylistic boundaries, and execution tone parameters.',
      content: JSON.stringify(
        {
          agentCodename: agent.codename,
          behavioralConstraints: agent.instructions.behavioralConstraints
        },
        null,
        2
      ),
      isSystemFile: true,
      lastModified: 'Just now',
      sizeBytes: 0
    },
    {
      id: `${agent.id}-file-guardrails`,
      name: 'GUARDRAILS.json',
      fileType: 'GUARDRAILS',
      format: 'json',
      description: 'HITL checkpoints, risk thresholds, blocked database vaults, and safety triggers.',
      content: JSON.stringify(
        {
          agentCodename: agent.codename,
          guardrails: agent.instructions.guardrails,
          requiresHITLFor: agent.requiresHITLFor,
          readVaults: agent.readVaults,
          writeVaults: agent.writeVaults,
          blockedVaults: agent.blockedVaults
        },
        null,
        2
      ),
      isSystemFile: true,
      lastModified: 'Just now',
      sizeBytes: 0
    },
    {
      id: `${agent.id}-file-skills`,
      name: 'SKILLS.json',
      fileType: 'SKILLS',
      format: 'json',
      description: 'Serialized MCP tool capabilities, clearance levels, function signatures, and execution metadata.',
      content: JSON.stringify(agent.skills, null, 2),
      isSystemFile: true,
      lastModified: 'Just now',
      sizeBytes: 0
    },
    {
      id: `${agent.id}-file-subagents`,
      name: 'SUBAGENTS_MANIFEST.json',
      fileType: 'SUBAGENTS',
      format: 'json',
      description: 'Delegation topology, worker sub-agent definitions, specialized tool assignments, and metrics.',
      content: JSON.stringify(agent.subAgents, null, 2),
      isSystemFile: true,
      lastModified: 'Just now',
      sizeBytes: 0
    },
    {
      id: `${agent.id}-file-heuristics`,
      name: 'HEURISTICS_DATA.json',
      fileType: 'HEURISTICS',
      format: 'json',
      description: 'Distilled reinforcement heuristics, reflection scores, and self-learning parameters.',
      content: JSON.stringify(agent.learningProfile, null, 2),
      isSystemFile: true,
      lastModified: 'Just now',
      sizeBytes: 0
    },
    {
      id: `${agent.id}-file-context`,
      name: 'KNOWLEDGE_CONTEXT.md',
      fileType: 'KNOWLEDGE',
      format: 'markdown',
      description: 'Second Brain vault bindings, domain-specific retrieval indexes, and reference grounding.',
      content: `# Second Brain Knowledge Context for ${agent.name} (${agent.codename})\n\n` +
        `## Bound Vaults:\n` +
        agent.readVaults.map(v => `- Read Access: **${v}**`).join('\n') + '\n' +
        agent.writeVaults.map(v => `- Write Access: **${v}**`).join('\n') + '\n' +
        agent.blockedVaults.map(v => `- Forbidden (RBAC Locked): ~~${v}~~`).join('\n') + '\n\n' +
        `## Core Strategic Role:\n${agent.description}\n\n` +
        `## Execution Protocol:\nAll queries must be verified against current Postgres schemas and pgvector semantic embeddings.`,
      isSystemFile: true,
      lastModified: 'Just now',
      sizeBytes: 0
    }
  ];

  // Calculate sizes
  files.forEach(f => {
    f.sizeBytes = new Blob([f.content]).size;
  });

  // Append any custom files already on agent
  if (agent.customFiles && agent.customFiles.length > 0) {
    agent.customFiles.forEach(cf => {
      files.push(cf);
    });
  }

  return files;
}

/**
 * Synchronize edited or uploaded file contents directly into the agent's live runtime state
 */
export function syncFileContentToAgent(
  file: AgentConfigFile,
  currentAgent: ScopedAgent
): { updatedAgent: ScopedAgent; changeSummary: string } {
  let updated = { ...currentAgent };
  let changeSummary = `Updated file ${file.name}`;

  try {
    const filename = file.name.toUpperCase();

    if (filename.includes('SYSTEM_PROMPT') || file.fileType === 'PROMPT') {
      // Strip leading header if user kept `# Title`
      let cleanPrompt = file.content;
      if (cleanPrompt.startsWith('#') && cleanPrompt.includes('\n\n')) {
        cleanPrompt = cleanPrompt.substring(cleanPrompt.indexOf('\n\n') + 2).trim();
      }
      updated.instructions = {
        ...updated.instructions,
        systemPrompt: cleanPrompt
      };
      changeSummary = `Updated System Prompt for ${updated.codename}`;
    } else if (filename.includes('DIRECTIVES') && file.format === 'json') {
      const parsed = JSON.parse(file.content);
      if (Array.isArray(parsed.operationalDirectives)) {
        updated.instructions = {
          ...updated.instructions,
          operationalDirectives: parsed.operationalDirectives,
          outputFormat: parsed.outputFormat || updated.instructions.outputFormat
        };
        changeSummary = `Updated Operational Directives (${parsed.operationalDirectives.length} rules)`;
      }
    } else if (filename.includes('CONSTRAINTS') && file.format === 'json') {
      const parsed = JSON.parse(file.content);
      if (Array.isArray(parsed.behavioralConstraints)) {
        updated.instructions = {
          ...updated.instructions,
          behavioralConstraints: parsed.behavioralConstraints
        };
        changeSummary = `Updated Behavioral Constraints (${parsed.behavioralConstraints.length} rules)`;
      }
    } else if (filename.includes('GUARDRAILS') && file.format === 'json') {
      const parsed = JSON.parse(file.content);
      if (Array.isArray(parsed.guardrails)) {
        updated.instructions = {
          ...updated.instructions,
          guardrails: parsed.guardrails
        };
      }
      if (Array.isArray(parsed.requiresHITLFor)) {
        updated.requiresHITLFor = parsed.requiresHITLFor;
      }
      if (Array.isArray(parsed.readVaults)) updated.readVaults = parsed.readVaults;
      if (Array.isArray(parsed.writeVaults)) updated.writeVaults = parsed.writeVaults;
      if (Array.isArray(parsed.blockedVaults)) updated.blockedVaults = parsed.blockedVaults;
      changeSummary = `Updated Guardrails & RBAC vault bounds`;
    } else if ((filename.includes('SKILL') || file.fileType === 'SKILLS') && file.format === 'json') {
      const parsed = JSON.parse(file.content);
      if (Array.isArray(parsed)) {
        updated.skills = parsed;
        changeSummary = `Synchronized Skills Matrix (${parsed.length} skills)`;
      } else if (parsed.name && parsed.toolSignature) {
        // Single skill JSON
        const exists = updated.skills.some(s => s.id === parsed.id || s.name === parsed.name);
        if (exists) {
          updated.skills = updated.skills.map(s => s.id === parsed.id || s.name === parsed.name ? { ...s, ...parsed } : s);
        } else {
          updated.skills = [...updated.skills, { ...parsed, id: parsed.id || `skill-${Date.now().toString().slice(-4)}` }];
        }
        changeSummary = `Registered skill "${parsed.name}" to skills matrix`;
      }
    } else if (filename.includes('SUBAGENT') && file.format === 'json') {
      const parsed = JSON.parse(file.content);
      if (Array.isArray(parsed)) {
        updated.subAgents = parsed;
        changeSummary = `Updated Sub-Agents Manifest (${parsed.length} sub-agents)`;
      }
    } else if (filename.includes('HEURISTIC') && file.format === 'json') {
      const parsed = JSON.parse(file.content);
      if (parsed.cycleIteration !== undefined || Array.isArray(parsed.heuristics)) {
        updated.learningProfile = {
          ...updated.learningProfile,
          ...parsed
        };
        changeSummary = `Updated Self-Learning Profile & Heuristics`;
      }
    } else if (filename.includes('AGENT_SPEC') || (file.fileType === 'SPEC' && file.format === 'markdown')) {
      const parsedAgent = importAgentFromMarkdown(file.content, updated);
      updated = { ...updated, ...parsedAgent };
      changeSummary = `Imported complete Agent Specification`;
    } else {
      // Custom file: save into customFiles list
      const existingCustom = updated.customFiles || [];
      const index = existingCustom.findIndex(cf => cf.id === file.id || cf.name === file.name);
      if (index >= 0) {
        existingCustom[index] = { ...file, lastModified: 'Just now', sizeBytes: new Blob([file.content]).size };
      } else {
        existingCustom.push({ ...file, lastModified: 'Just now', sizeBytes: new Blob([file.content]).size });
      }
      updated.customFiles = existingCustom;
      changeSummary = `Saved custom file "${file.name}"`;
    }
  } catch (err: any) {
    console.error('Failed to parse file for agent sync:', err);
    throw new Error(`File sync error: ${err.message}`);
  }

  return { updatedAgent: updated, changeSummary };
}

/**
 * Trigger download of an individual file in browser
 */
export function downloadAgentFile(file: AgentConfigFile): void {
  let mimeType = 'text/plain;charset=utf-8';
  if (file.format === 'json') mimeType = 'application/json;charset=utf-8';
  else if (file.format === 'markdown') mimeType = 'text/markdown;charset=utf-8';
  else if (file.format === 'typescript') mimeType = 'text/typescript;charset=utf-8';
  else if (file.format === 'yaml') mimeType = 'text/yaml;charset=utf-8';

  const blob = new Blob([file.content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all agent files as a consolidated JSON bundle package
 */
export function downloadAgentFileBundle(agent: ScopedAgent, files: AgentConfigFile[]): void {
  const bundle = {
    exportedAt: new Date().toISOString(),
    agentId: agent.id,
    agentName: agent.name,
    agentCodename: agent.codename,
    filesCount: files.length,
    files: files.map(f => ({
      name: f.name,
      fileType: f.fileType,
      format: f.format,
      description: f.description,
      isSystemFile: f.isSystemFile,
      lastModified: f.lastModified,
      sizeBytes: f.sizeBytes,
      content: f.content
    }))
  };

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${agent.codename.toLowerCase()}-config-bundle.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse uploaded skill file from user
 * Supports .json, .md (SKILL.md), or .ts/.js
 */
export function parseSkillFile(fileContent: string, fileName: string): AgentSkill[] {
  const lowerName = fileName.toLowerCase();

  // 1. JSON handling
  if (lowerName.endsWith('.json') || fileContent.trim().startsWith('{') || fileContent.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => sanitizeSkill(item, idx));
      } else if (typeof parsed === 'object' && parsed !== null) {
        return [sanitizeSkill(parsed, 0)];
      }
    } catch (e: any) {
      throw new Error(`Invalid JSON syntax in skill file: ${e.message}`);
    }
  }

  // 2. Markdown handling (SKILL.md format)
  if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
    const lines = fileContent.split('\n');
    let inFrontmatter = false;
    const frontmatter: Record<string, string> = {};
    let body = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
          continue;
        } else {
          inFrontmatter = false;
          body = lines.slice(i + 1).join('\n').trim();
          break;
        }
      }

      if (inFrontmatter) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.substring(0, colonIdx).trim();
          const val = line.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
          frontmatter[key] = val;
        }
      }
    }

    // Extract skill attributes
    const name = frontmatter.name || frontmatter.title || fileName.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
    const category = (frontmatter.category?.toUpperCase() || 'RESEARCH') as AgentSkill['category'];
    const clearance = (frontmatter.clearanceLevel || frontmatter.clearance || 'AUTONOMOUS') as AgentSkill['clearanceLevel'];
    const toolSignature = frontmatter.toolSignature || frontmatter.signature || `${name.toLowerCase().replace(/\s+/g, '_')}()`;
    const description = frontmatter.description || body.slice(0, 200).replace(/[#*`_]/g, '').trim() || 'Imported markdown skill definition';

    return [{
      id: frontmatter.id || `skill-md-${Date.now().toString().slice(-4)}`,
      name,
      category: ['RESEARCH', 'OPTIMIZATION', 'EXECUTION', 'VERIFICATION', 'GOVERNANCE'].includes(category) ? category : 'RESEARCH',
      description,
      toolSignature,
      clearanceLevel: ['AUTONOMOUS', 'RESTRICTED_HITL', 'HIGH_SECURITY'].includes(clearance) ? clearance : 'AUTONOMOUS',
      isActive: true,
      successRate: frontmatter.successRate || '100%',
      invocationCount: parseInt(frontmatter.invocationCount || '0', 10) || 0,
      markdownDoc: body || fileContent,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
  }

  // 3. TypeScript / JavaScript file handling
  if (lowerName.endsWith('.ts') || lowerName.endsWith('.js')) {
    // Attempt to extract function name and signature
    const funcMatch = fileContent.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
    const arrowMatch = fileContent.match(/(?:export\s+)?(?:const|let)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(([^)]*)\)/);

    let funcName = fileName.replace(/\.[tj]s$/i, '');
    let signature = `${funcName}()`;

    if (funcMatch) {
      funcName = funcMatch[1];
      signature = `${funcName}(${funcMatch[2].trim()})`;
    } else if (arrowMatch) {
      funcName = arrowMatch[1];
      signature = `${funcName}(${arrowMatch[2].trim()})`;
    }

    return [{
      id: `skill-ts-${Date.now().toString().slice(-4)}`,
      name: funcName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(),
      category: 'EXECUTION',
      description: `TypeScript programmatic execution tool extracted from ${fileName}.`,
      toolSignature: signature,
      clearanceLevel: 'AUTONOMOUS',
      isActive: true,
      successRate: '100%',
      invocationCount: 0,
      executionCode: fileContent,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
  }

  // Fallback generic text parse
  return [{
    id: `skill-custom-${Date.now().toString().slice(-4)}`,
    name: fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    category: 'RESEARCH',
    description: fileContent.slice(0, 180).trim() || 'Imported custom skill tool',
    toolSignature: `${fileName.replace(/[^a-zA-Z0-9_]/g, '_')}()`,
    clearanceLevel: 'AUTONOMOUS',
    isActive: true,
    successRate: '100%',
    invocationCount: 0,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }];
}

function sanitizeSkill(raw: any, index: number): AgentSkill {
  return {
    id: raw.id || `skill-imp-${Date.now().toString().slice(-4)}-${index}`,
    name: raw.name || `Imported Skill ${index + 1}`,
    category: ['RESEARCH', 'OPTIMIZATION', 'EXECUTION', 'VERIFICATION', 'GOVERNANCE'].includes(raw.category?.toUpperCase())
      ? raw.category.toUpperCase()
      : 'RESEARCH',
    description: raw.description || 'Imported tool definition.',
    toolSignature: raw.toolSignature || `${(raw.name || 'custom_tool').toLowerCase().replace(/\s+/g, '_')}()`,
    clearanceLevel: ['AUTONOMOUS', 'RESTRICTED_HITL', 'HIGH_SECURITY'].includes(raw.clearanceLevel)
      ? raw.clearanceLevel
      : 'AUTONOMOUS',
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    successRate: raw.successRate || '100%',
    invocationCount: typeof raw.invocationCount === 'number' ? raw.invocationCount : 0,
    parametersSchema: raw.parametersSchema ? (typeof raw.parametersSchema === 'string' ? raw.parametersSchema : JSON.stringify(raw.parametersSchema, null, 2)) : undefined,
    executionCode: raw.executionCode || undefined,
    markdownDoc: raw.markdownDoc || undefined,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

/**
 * Export a single skill to standard Markdown (SKILL.md) format
 */
export function exportSkillToMarkdown(skill: AgentSkill): string {
  const frontmatter = [
    '---',
    `id: "${skill.id}"`,
    `name: "${skill.name}"`,
    `category: "${skill.category}"`,
    `clearanceLevel: "${skill.clearanceLevel}"`,
    `toolSignature: "${skill.toolSignature}"`,
    `isActive: ${skill.isActive}`,
    `successRate: "${skill.successRate}"`,
    `invocationCount: ${skill.invocationCount}`,
    '---'
  ].join('\n');

  return `${frontmatter}\n\n# ${skill.name}\n\n${skill.description}\n\n## Tool Signature\n\`\`\`typescript\n${skill.toolSignature}\n\`\`\`\n\n` +
    (skill.parametersSchema ? `## Parameters Schema\n\`\`\`json\n${skill.parametersSchema}\n\`\`\`\n\n` : '') +
    (skill.executionCode ? `## Execution Code\n\`\`\`typescript\n${skill.executionCode}\n\`\`\`\n\n` : '') +
    `## Security & Clearance\n- Clearance Tier: \`${skill.clearanceLevel}\`\n- Historical Success Rate: **${skill.successRate}**\n- Recorded Invocations: **${skill.invocationCount}**\n`;
}

/**
 * Export a single skill as JSON
 */
export function exportSkillToJSON(skill: AgentSkill): string {
  return JSON.stringify(skill, null, 2);
}
