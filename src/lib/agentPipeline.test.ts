import { describe, it, expect } from "vitest";
import { buildScopedBrainContext } from "./agentPolicies.js";
import { GROWTH_OS_AGENT_TOOLS, GROWTH_OS_OPENAI_TOOLS, executeAgentToolCall } from "./agentTools.js";
import type { SecondBrain } from "../types.js";

const mockBrain: SecondBrain = {
  executiveVault: { financialsOverview: "$1M ARR", strategicPlans: "Scale B2B", intellectualProperty: "Growth OS Patents" },
  credentialsVault: [],
  brandVault: { corePositioning: "Premium Growth OS", voiceAndTone: "Strategic", brandSlogan: "Empower Growth", offersAndPricing: "$5k/mo", keyMessages: ["Fast", "Secure"] },
  customerVault: { idealCustomerProfile: "B2B Founders", targetSegments: ["SaaS"], customerObjections: ["Price"], testimonials: ["Great OS"] },
  marketingVault: { campaignHistory: "Meta & Google Ads", currentChannels: ["Meta Ads", "Google Ads"], recentPerformance: "ROAS 4.2x" },
  websiteVault: { siteUrl: "https://example.com", cmsType: "Next.js", analyticsId: "GA-12345", pageHistory: "/home" },
  authorityVault: { targetKeywords: ["growth os", "ai marketing"], backlinkProfileSummary: "50 domains", seoFocusAreas: ["Technical SEO"] },
  operationsVault: { standardOperatingProcedures: [], orgHierarchy: "Engineering, Marketing, Operations" },
  aiWorkflowVault: [],
  auditVault: { overallScore: 90, lastAuditedAt: "2026-07-31", findings: { websitePresence: "Strong", socialMediaPresence: "Active", seoReadiness: "High", aiVisibility: "Optimized", offerClarity: "Clear", positioningStrength: "Dominant", funnelQuality: "High", analyticsReadiness: "Configured" } },
  uploadedFiles: [],
  connectors: [],
  internalStack: [],
};



describe("Agentic OS Enhancements", () => {
  it("buildScopedBrainContext injects active KPI benchmarks when provided", () => {
    const context = buildScopedBrainContext(["Brand Vault", "Marketing Vault"], mockBrain, {
      performanceMetrics: { targetRoas: 4.0, targetCpa: 50, targetCpl: 15 },
    });
    expect(context).toContain("Brand positioning: Premium Growth OS");
    expect(context).toContain("Active Performance KPI Benchmarks: Target ROAS: 4x | Target CPA: $50 | Target CPL: $15");
  });

  it("buildScopedBrainContext injects retrieved RAG memory snippets", () => {
    const context = buildScopedBrainContext(["Brand Vault"], mockBrain, {
      ragSnippets: ["Stop using generic marketing agency retainers.", "Scale B2B outbound with role-based AI agents."],
    });
    expect(context).toContain("Historical Top-Performing Memory & Winning Copy Hooks");
    expect(context).toContain("Hook 1: Stop using generic marketing agency retainers.");
  });

  it("exports valid Gemini agent tool declarations", () => {
    expect(Array.isArray(GROWTH_OS_AGENT_TOOLS)).toBe(true);
    expect(GROWTH_OS_AGENT_TOOLS.length).toBeGreaterThanOrEqual(3);
    const toolNames = GROWTH_OS_AGENT_TOOLS.map((t) => t.name);
    expect(toolNames).toContain("fetch_site_content");
    expect(toolNames).toContain("search_second_brain");
    expect(toolNames).toContain("get_connector_status");
  });

  it("executes get_connector_status tool call cleanly", async () => {
    const res = await executeAgentToolCall({
      name: "get_connector_status",
      args: {},
      secondBrain: mockBrain,
    });
    expect(res.connectedPlatforms).toEqual(["Meta Ads", "Google Ads"]);
  });

  it("exports valid OpenAI-compatible tools including sandboxed tools", () => {
    expect(Array.isArray(GROWTH_OS_OPENAI_TOOLS)).toBe(true);
    expect(GROWTH_OS_OPENAI_TOOLS.length).toBeGreaterThanOrEqual(6);
    const names = GROWTH_OS_OPENAI_TOOLS.map((t: any) => t.function.name);
    expect(names).toContain("run_sandboxed_command");
    expect(names).toContain("read_workspace_file");
    expect(names).toContain("write_workspace_file");
    expect(names).toContain("http_request");
  });

  it("executes write_workspace_file and read_workspace_file within workspace", async () => {
    const testPath = "output/test_deliverable.txt";
    const testContent = "Sigma Tactix Growth OS autonomous agent artifact verification.";

    const writeRes = await executeAgentToolCall({
      name: "write_workspace_file",
      args: { filePath: testPath, content: testContent },
    });
    expect(writeRes.success).toBe(true);

    const readRes = await executeAgentToolCall({
      name: "read_workspace_file",
      args: { filePath: testPath },
    });
    expect(readRes.content).toBe(testContent);
  });

  it("blocks path traversal outside workspace root", async () => {
    const res = await executeAgentToolCall({
      name: "read_workspace_file",
      args: { filePath: "../../../etc/passwd" },
    });
    expect(res.error).toContain("Path traversal");
  });

  it("executes safe commands with run_sandboxed_command", async () => {
    const res = await executeAgentToolCall({
      name: "run_sandboxed_command",
      args: { command: "echo 'hello from sandbox'" },
    });
    expect(res.stdout).toContain("hello from sandbox");
    expect(res.success).toBe(true);
  });
});
