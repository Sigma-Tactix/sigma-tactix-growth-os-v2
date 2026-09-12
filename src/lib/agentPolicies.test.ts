import { describe, it, expect } from "vitest";
import {
  evaluateAgentRequest,
  getAgentPolicy,
  AGENT_VAULT_POLICIES,
  documentVaultIdsForScope,
  type VaultName,
} from "./agentPolicies.js";

describe("agent vault RBAC", () => {
  it("authorizes an in-scope request for the Marketing Agent", () => {
    const r = evaluateAgentRequest("Marketing Agent", ["Brand Vault", "Customer Vault"]);
    expect(r.authorized).toBe(true);
    expect(r.unauthorizedRequests).toEqual([]);
  });

  it("blocks secret vaults for every agent", () => {
    for (const agent of Object.keys(AGENT_VAULT_POLICIES)) {
      const r = evaluateAgentRequest(agent, ["Executive Vault", "Credentials Vault"]);
      expect(r.authorized).toBe(false);
      expect(r.unauthorizedRequests).toContain("Executive Vault");
      expect(r.unauthorizedRequests).toContain("Credentials Vault");
    }
  });

  it("rejects a vault not in the agent's allowed scope", () => {
    // AI SDR has no Marketing Vault access.
    const r = evaluateAgentRequest("AI SDR (Sales Agent)", ["Marketing Vault"]);
    expect(r.authorized).toBe(false);
    expect(r.unauthorizedRequests).toEqual(["Marketing Vault"]);
  });

  it("default-denies an unknown agent", () => {
    const r = evaluateAgentRequest("Rogue Agent", ["Brand Vault"]);
    expect(r.authorized).toBe(false);
    expect(getAgentPolicy("Rogue Agent")).toEqual({ allowed: [], blocked: [] });
  });

  it("returns only the out-of-scope vaults, keeping allowed ones", () => {
    const requested: VaultName[] = ["Brand Vault", "Executive Vault", "Authority Vault"];
    const r = evaluateAgentRequest("Marketing Agent", requested);
    expect(r.unauthorizedRequests).toEqual(["Executive Vault"]);
  });
});

// RAG scope enforcement (migration 0013). Before this, executeAgentTask ran an
// UNFILTERED vector search and appended the results beneath a prompt preamble
// that had been correctly filtered — so an agent whose policy blocks a vault
// could still be handed that vault's documents through retrieval.
describe("documentVaultIdsForScope", () => {
  it("fails CLOSED for an agent with no authorized vaults", () => {
    // [] is passed to match_documents_scoped as p_vault_ids, where
    // `vault_id = ANY('{}')` is false for every row. An unscoped agent
    // therefore retrieves nothing. If this ever returned [] meaning
    // "unrestricted", an unknown agent would gain full retrieval.
    expect(documentVaultIdsForScope([])).toEqual([]);
  });

  it("never maps the always-blocked vaults, even if they appear in a scope", () => {
    const ids = documentVaultIdsForScope(["Executive Vault", "Credentials Vault"]);
    expect(ids).toEqual([]);
    expect(ids).not.toContain("executive");
    expect(ids).not.toContain("credentials");
  });

  it("translates display names to the document vault_id namespace they are stored under", () => {
    // The two namespaces genuinely differ: the policy matrix says "Brand Vault",
    // documents.vault_id says "brand". Filtering by the display name would match
    // zero rows and look like a broken feature rather than a closed hole.
    const ids = documentVaultIdsForScope(["Brand Vault", "Customer Vault"]);
    expect(ids).toContain("brand");
    expect(ids).toContain("customer");
    expect(ids).not.toContain("Brand Vault");
  });

  it("maps Marketing Vault onto both marketing and performance documents", () => {
    // indexPerformanceHook() files winning ad copy under 'marketing'; the
    // Performance module files uploaded reports under 'performance'.
    const ids = documentVaultIdsForScope(["Marketing Vault"]);
    expect(ids).toEqual(expect.arrayContaining(["marketing", "performance"]));
  });

  it("includes unclassified 'general' uploads only when some vault is authorized", () => {
    expect(documentVaultIdsForScope(["Brand Vault"])).toContain("general");
    expect(documentVaultIdsForScope([])).not.toContain("general");
  });

  it("gives a blocked-vault agent no route to the blocked vault's documents", () => {
    // AI SDR's policy blocks Marketing Vault; its RAG scope must not contain
    // any marketing document id.
    const scope = getAgentPolicy("AI SDR (Sales Agent)").allowed;
    const ids = documentVaultIdsForScope(scope);
    expect(ids).not.toContain("marketing");
    expect(ids).not.toContain("performance");
    expect(ids).toContain("brand");
    expect(ids).toContain("customer");
  });
});
