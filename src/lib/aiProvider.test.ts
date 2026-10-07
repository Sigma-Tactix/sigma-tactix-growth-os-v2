import { describe, it, expect, vi } from "vitest";
import { resolveProviderBaseUrl, executeAgentReActLoop, AIProviderConfig } from "./aiProvider.js";

describe("aiProvider - Unified Agent AI Gateway & ReAct Execution", () => {
  it("resolves correct default base URLs for each provider", () => {
    expect(resolveProviderBaseUrl("ollama")).toBe("http://127.0.0.1:11434/v1");
    expect(resolveProviderBaseUrl("lmstudio")).toBe("http://127.0.0.1:1234/v1");
    expect(resolveProviderBaseUrl("openai")).toBe("https://api.openai.com/v1");
    expect(resolveProviderBaseUrl("deepseek")).toBe("https://api.deepseek.com/v1");
    expect(resolveProviderBaseUrl("qwen")).toBe("https://dashscope.aliyuncs.com/compatible-mode/v1");
    expect(resolveProviderBaseUrl("openrouter")).toBe("https://openrouter.ai/api/v1");
  });

  it("respects explicit baseUrl override", () => {
    expect(resolveProviderBaseUrl("ollama", "http://my-gpu-cluster:11434/v1/")).toBe("http://my-gpu-cluster:11434/v1");
  });

  it("executes multi-turn ReAct loop with tool calls via mock OpenAI-compatible endpoint", async () => {
    let callCount = 0;
    const executedTools: string[] = [];

    // Mock global fetch for OpenAI-compatible completions
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      callCount++;
      if (callCount === 1) {
        // Step 1: Model decides to call fetch_site_content
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: null,
                  tool_calls: [
                    {
                      id: "call_abc123",
                      type: "function",
                      function: {
                        name: "fetch_site_content",
                        arguments: JSON.stringify({ url: "https://example.com" }),
                      },
                    },
                  ],
                },
              },
            ],
            usage: { prompt_tokens: 150, completion_tokens: 40 },
          }),
        };
      } else {
        // Step 2: Model finishes with deliverable markdown
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "# Comprehensive Growth Audit\n\nFound 0 critical SEO issues.",
                },
              },
            ],
            usage: { prompt_tokens: 220, completion_tokens: 80 },
          }),
        };
      }
    });

    try {
      const config: AIProviderConfig = {
        provider: "ollama",
        model: "qwen2.5:14b",
      };

      const result = await executeAgentReActLoop({
        agentName: "Website Experience Auditor",
        goal: "Audit https://example.com for conversion and SEO friction.",
        scopedContext: "Brand: Example SaaS",
        config,
        maxSteps: 3,
        executeTool: async (name, args) => {
          executedTools.push(name);
          return { url: args.url, title: "Example Domain", h1s: ["Example"] };
        },
      });

      expect(callCount).toBe(2);
      expect(executedTools).toContain("fetch_site_content");
      expect(result.output).toContain("Comprehensive Growth Audit");
      expect(result.detailedSteps.length).toBe(2);
      expect(result.detailedSteps[0].action).toBe("tool_call:fetch_site_content");
      expect(result.detailedSteps[1].action).toBe("final_response");
      expect(result.providerUsed).toBe("ollama");
      expect(result.modelUsed).toBe("qwen2.5:14b");
      expect(result.estimatedCostUsd).toBe(0); // Free for local models
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("handles immediate text completion without tools", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                role: "assistant",
                content: "Strategic plan completed.",
              },
            },
          ],
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        }),
      };
    });

    try {
      const result = await executeAgentReActLoop({
        agentName: "Strategy Agent",
        goal: "Quick plan",
        scopedContext: "Brand: Acme",
        config: { provider: "ollama", model: "llama3.3:70b" },
        maxSteps: 3,
        executeTool: async () => ({}),
      });

      expect(result.output).toBe("Strategic plan completed.");
      expect(result.detailedSteps.length).toBe(1);
      expect(result.detailedSteps[0].action).toBe("final_response");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
