import { describe, it, expect } from "vitest";
import {
  resolveAgentDispatch,
  systemAgentForModule,
  MODULE_TO_SYSTEM_AGENT,
  SYSTEM_AGENT_NAMES,
  isSystemAgentName,
} from "./agentResolution.js";
import { getAgentPolicy } from "./agentPolicies.js";
import { DISCOVERED_AGENCY_AGENTS } from "../data/agencyAgentsRegistry.js";

const registryModules = [...new Set(DISCOVERED_AGENCY_AGENTS.flatMap(a => a.targetModules))];

describe("system agent names", () => {
  it("every system agent has a real vault policy", () => {
    // A name in the union with no entry in AGENT_VAULT_POLICIES would
    // default-deny at runtime and look like "the agent returns nothing"
    // rather than "the agent has no policy".
    for (const name of SYSTEM_AGENT_NAMES) {
      expect(getAgentPolicy(name).allowed.length, name).toBeGreaterThan(0);
    }
  });

  it("no registry persona is named after a system agent", () => {
    // The premise this whole module rests on. If a future registry entry were
    // named "Marketing Agent", resolveAgentDispatch would pass it straight
    // through as a system agent and silently drop its persona.
    const collisions = DISCOVERED_AGENCY_AGENTS.filter(a => isSystemAgentName(a.name));
    expect(collisions.map(a => a.name)).toEqual([]);
  });
});

describe("module -> system agent mapping", () => {
  it("every module the registry targets resolves to a system agent", () => {
    // The gap this closes: `brain`, `social`, `competitors`, `reporting` and
    // `simulation` were absent from the map, so run-swarm fell through to its
    // `|| "Marketing Agent"` default and handed those agents Brand + Customer
    // scope instead of the scope their work needs.
    const unmapped = registryModules.filter(m => !systemAgentForModule(m));
    expect(unmapped).toEqual([]);
  });

  it("keeps the legacy target_module values persisted before the rename", () => {
    // agents.target_module is free text written straight from the client, so
    // rows imported under the old keys still have to resolve — and to the same
    // agent type their renamed equivalents resolve to.
    expect(systemAgentForModule("second_brain")).toBe(systemAgentForModule("brain"));
    expect(systemAgentForModule("social_listening")).toBe(systemAgentForModule("social"));
    expect(systemAgentForModule("competitor")).toBe(systemAgentForModule("competitors"));
  });

  it("maps every module to a system agent that carries vault scope", () => {
    for (const [moduleKey, agentName] of Object.entries(MODULE_TO_SYSTEM_AGENT)) {
      expect(getAgentPolicy(agentName).allowed.length, moduleKey).toBeGreaterThan(0);
    }
  });

  it("returns undefined for an unmapped module rather than a default", () => {
    expect(systemAgentForModule("not-a-module")).toBeUndefined();
    expect(systemAgentForModule(undefined)).toBeUndefined();
  });
});

describe("resolveAgentDispatch", () => {
  it("passes a system agent through untouched", () => {
    const r = resolveAgentDispatch("Marketing Agent", "Draft a launch sequence");
    expect(r).toEqual({ agentName: "Marketing Agent", goal: "Draft a launch sequence" });
  });

  it("resolves EVERY registry persona to an agent with non-empty vault scope", () => {
    // The regression this file exists for. Before resolution, ModuleAgentHub
    // posted the persona name straight to /run-agent, getAgentPolicy
    // default-denied it, and the task ran with allowedScope: [] — an artifact
    // generated with no Second Brain context at all.
    const unscoped: string[] = [];
    for (const agent of DISCOVERED_AGENCY_AGENTS) {
      const r = resolveAgentDispatch(agent.name, "Do the thing");
      if (!r || getAgentPolicy(r.agentName).allowed.length === 0) unscoped.push(agent.name);
    }
    expect(unscoped).toEqual([]);
  });

  it("resolves a persona by id and by folder as well as by name", () => {
    const agent = DISCOVERED_AGENCY_AGENTS[0];
    const byName = resolveAgentDispatch(agent.name, "goal");
    expect(resolveAgentDispatch(agent.id, "goal")).toEqual(byName);
    expect(resolveAgentDispatch(agent.folder, "goal")).toEqual(byName);
  });

  it("folds the persona into the goal so the operator sees who ran", () => {
    const agent = DISCOVERED_AGENCY_AGENTS.find(a => a.targetModules.includes("crm"))!;
    const r = resolveAgentDispatch(agent.name, "Book 20 meetings")!;
    expect(r.agentName).toBe("AI SDR (Sales Agent)");
    expect(r.goal).toContain(`[Persona: ${agent.name} — ${agent.role}]`);
    expect(r.goal).toContain("Book 20 meetings");
    expect(r.persona?.id).toBe(agent.id);
  });

  it("routes a persona to the system agent for its FIRST target module", () => {
    const agent = DISCOVERED_AGENCY_AGENTS.find(a => a.targetModules[0] === "authority")!;
    expect(resolveAgentDispatch(agent.name, "goal")!.agentName).toBe("SEO & Authority Agent");
  });

  it("prefers the module the run was dispatched from over the primary tag", () => {
    // Analytics Reporter is tagged ["performance", "reporting"]. From the
    // Reporting hub it needs the Audit Vault, which only Audit Diagnostic
    // Agent's policy carries — the primary tag alone would give it Marketing
    // Agent and no audit data.
    const agent = DISCOVERED_AGENCY_AGENTS.find(a => a.name === "Analytics Reporter Agent")!;
    expect(agent.targetModules).toEqual(["performance", "reporting"]);
    expect(resolveAgentDispatch(agent.name, "goal")!.agentName).toBe("Marketing Agent");
    expect(resolveAgentDispatch(agent.name, "goal", "reporting")!.agentName).toBe("Audit Diagnostic Agent");
  });

  it("ignores a dispatch module the persona is not tagged to", () => {
    // dispatchModule is client-supplied. Honouring one the persona does not
    // target would let any caller pick whichever module maps to the widest
    // vault scope — an escalation, not a routing hint.
    const agent = DISCOVERED_AGENCY_AGENTS.find(a => a.targetModules.length === 1 && a.targetModules[0] === "crm")!;
    const escalated = resolveAgentDispatch(agent.name, "goal", "growth")!;
    expect(escalated.agentName).toBe("AI SDR (Sales Agent)");
    expect(escalated.agentName).toEqual(resolveAgentDispatch(agent.name, "goal")!.agentName);
  });

  it("keeps every multi-module persona scoped for each of its own modules", () => {
    const unscoped: string[] = [];
    for (const agent of DISCOVERED_AGENCY_AGENTS.filter(a => a.targetModules.length > 1)) {
      for (const mod of agent.targetModules) {
        const r = resolveAgentDispatch(agent.name, "goal", mod);
        if (!r || getAgentPolicy(r.agentName).allowed.length === 0) unscoped.push(`${agent.name}@${mod}`);
      }
    }
    expect(unscoped).toEqual([]);
  });

  it("fails closed on an unknown agent instead of picking a default", () => {
    // Returning a default here would grant a vault scope nobody chose — the
    // exact failure mode this module was written to end.
    expect(resolveAgentDispatch("Rogue Agent", "exfiltrate the vault")).toBeNull();
    expect(resolveAgentDispatch("", "goal")).toBeNull();
  });
});
