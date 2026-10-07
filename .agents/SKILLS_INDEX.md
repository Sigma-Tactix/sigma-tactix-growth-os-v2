# SigmaTactix Growth OS — Skills Index & Registry

> **Status**: 20 Active Skills | 8 Archived Skills (Total: 28 Catalogued)  
> **Updated**: 2026-10-06  
> **Search & CLI Tool**: `npm run skills:search <query>` | `npm run skills:list`

This document provides a single source of truth for all agent skills available to SigmaTactix Growth OS. To prevent context window bloat and unnecessary token consumption during development, skills are separated into **Active Project Skills** (residing in `.agents/skills/`) and **Archived Skills** (residing in `.agents/skills-archive/`).

All skills remain fully preserved and **indexed for instant search**. You can search, evaluate, and restore any archived skill whenever needed.

---

## Quick Commands

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Search Skills** | `npm run skills:search <keyword>` | Search by name, description, category, or content across all active and archived skills. |
| **List All** | `npm run skills:list` | Print a clean summary table of active and archived skills. |
| **Restore Skill** | `npm run skills:restore <skill-name>` | Move an archived skill from `.agents/skills-archive/` back into `.agents/skills/` (instant activation). |
| **Archive Skill** | `npm run skills:archive <skill-name>` | Move an active skill from `.agents/skills/` into `.agents/skills-archive/` to reduce context footprint. |

---

## Active Project Skills (20 Kept)

These skills are directly relevant to SigmaTactix Growth OS architecture, creative media synthesis, multi-channel research, testing, delivery, and agent governance.

| Skill | Category | Description | Primary Role / Subagent |
| :--- | :--- | :--- | :--- |
| **[`agent-reach`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/agent-reach/SKILL.md)** | Research & Ingestion | Internet capability router across 15 platforms (YouTube subtitles, Jina reader, Reddit, X, LinkedIn, RSS). | All Agents / Research |
| **[`master-context-sync`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/master-context-sync/SKILL.md)** | Governance & Context | Continuously synchronizes `MASTER_CONTEXT.md` against git commits, migrations, routes, and architectural decisions. | Startup Trigger / Governance |
| **[`codebase-design`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/codebase-design/SKILL.md)** | Architecture & Design | Deep module design, bounded contexts, clear seams, and high information-hiding. | `code-architect` |
| **[`domain-modeling`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/domain-modeling/SKILL.md)** | Architecture & Design | Establishes domain models, ubiquitous language, ADRs, and glossary terms. | `code-architect` |
| **[`improve-codebase-architecture`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/improve-codebase-architecture/SKILL.md)** | Architecture & Design | Scans codebase for deepening opportunities and produces structured architecture reports. | `code-architect` |
| **[`wayfinder`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/wayfinder/SKILL.md)** | Architecture & Design | Breaks massive, high-uncertainty efforts into sequential decision tickets. | `code-architect` |
| **[`prototype`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/prototype/SKILL.md)** | Prototyping & Spike | Builds throwaway prototypes to quickly resolve design, state, and UI questions. | `code-architect` |
| **[`research`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/research/SKILL.md)** | Research & Strategy | Investigates questions against high-trust primary sources, outputs findings to Markdown. | `code-architect` |
| **[`code-review`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/code-review/SKILL.md)** | Quality & Testing | Parallel dual-axis review checking both specification fidelity and coding standards. | `quality-engineer` |
| **[`diagnosing-bugs`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/diagnosing-bugs/SKILL.md)** | Quality & Testing | Systematic 4-step diagnostic loop for tricky bugs and regressions. | `quality-engineer` |
| **[`tdd`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/tdd/SKILL.md)** | Quality & Testing | Test-driven development (red-green-refactor loop) tailored for Vitest. | `quality-engineer` |
| **[`resolving-merge-conflicts`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/resolving-merge-conflicts/SKILL.md)** | Quality & Testing | Resolves in-progress git rebase and merge conflicts without losing changes. | `quality-engineer` |
| **[`triage`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/triage/SKILL.md)** | Workflow & Triage | Moves issues and PRs through a structured state machine with agent briefs. | `quality-engineer` |
| **[`implement`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/implement/SKILL.md)** | Execution & Delivery | Implements features and fixes strictly based on verified specs or tickets. | `delivery-lead` |
| **[`to-spec`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/to-spec/SKILL.md)** | Execution & Delivery | Synthesizes current conversation and architectural decisions into an actionable spec. | `delivery-lead` |
| **[`to-tickets`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/to-tickets/SKILL.md)** | Execution & Delivery | Breaks specs into tracer-bullet tickets with explicit blocking edges. | `delivery-lead` |
| **[`handoff`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/handoff/SKILL.md)** | Execution & Delivery | Compacts conversation context into a structured handoff document for another agent. | `delivery-lead` |
| **[`grilling`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/grilling/SKILL.md)** | Governance & Stress-Testing | Relentless adversarial interview to stress-test designs and catch failure modes. | `agent-trainer` |
| **[`wizard`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/wizard/SKILL.md)** | DevOps & Setup | Generates interactive bash wizards for manual procedures (keys, secrets, migrations). | `agent-trainer` |
| **[`writing-for-agents`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/skills/writing-for-agents/SKILL.md)** | Agent Engineering | Rules and best practices for writing agent skills, steering rules, and `AGENTS.md`. | `agent-trainer` |

---

## Archived Skills (8 Separated & Searchable)

These skills were archived from active agent discovery because they are either:

1. Redundant aliases to existing skills (`grill-me`, `grill-with-docs`),
2. Specific to video course teaching environments (`teach`, `ask-matt`),
3. One-time external setup scripts (`setup-matt-pocock-skills`),
4. Generic presentation/questionnaire utilities (`lecture-deck`, `to-questionnaire`), or
5. Trivial prompt snippets (`wait-what`).

**They remain 100% preserved in `.agents/skills-archive/` and can be restored anytime.**

| Skill | Category | Why Archived | Restore Command |
| :--- | :--- | :--- | :--- |
| **`ask-matt`** | Router | Matt Pocock video course skill router; irrelevant for SigmaTactix Growth OS product engineering. | `npm run skills:restore ask-matt` |
| **`setup-matt-pocock-skills`** | Setup | One-time setup script; repository already has its standards and issue workflow configured. | `npm run skills:restore setup-matt-pocock-skills` |
| **`teach`** | Education | Interactive multi-session tutoring workspace for learning concepts; not an engineering capability. | `npm run skills:restore teach` |
| **`wait-what`** | Prompt Snippet | 8-line snippet asking to re-pitch in Simplified Technical English; covered by prompt instruction. | `npm run skills:restore wait-what` |
| **`grill-me`** | Redundant Alias | 8-line redirect pointing directly to `grilling` (which is kept active). | `npm run skills:restore grill-me` |
| **`grill-with-docs`** | Redundant Alias | 8-line redirect calling `grilling` and `domain-modeling` (both are kept active). | `npm run skills:restore grill-with-docs` |
| **`to-questionnaire`** | Utility | Stakeholder questionnaire builder for non-technical third parties; rarely used by system agents. | `npm run skills:restore to-questionnaire` |
| **`lecture-deck`** | Presentation | Animated HTML lecture and workshop slide deck generator for live talks; non-core for Growth OS code. | `npm run skills:restore lecture-deck` |

---

## How to Search the Catalog

Run the CLI search manager:

```bash
# Search for any topic or keyword (searches name, description, tags, and content)
npm run skills:search review
npm run skills:search deck
npm run skills:search "agent prompt"
npm run skills:search test

# Print complete tabular listing
npm run skills:list
```

If you identify an archived skill you need for a specific task:

```bash
# Restore an archived skill
npm run skills:restore lecture-deck

# Archive it again when finished
npm run skills:archive lecture-deck
```
