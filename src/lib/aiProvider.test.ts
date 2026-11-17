import { describe, it, expect, vi } from "vitest";
import { resolveProviderBaseUrl, executeAgentReActLoop, AIProviderConfig } from "./aiProvider.js";

describe("aiProvider - Unified Agent AI Gateway & ReAct Execution", () => {
  it('executes Anthropic tool calls using Messages API rather than the OpenAI wire format', async () => {
    const originalFetch = globalThis.fetch;
    const bodies: any[] = [];
    globalThis.fetch = vi.fn(async (url, options) => {
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(options?.headers).toMatchObject({ 'x-api-key': 'saved-anthropic-key' });
      const body = JSON.parse(options?.body as string);
      bodies.push(body);
      return { ok: true, json: async () => ({
        content: bodies.length === 1
          ? [{ type: 'tool_use', id: 'call-a', name: 'fetch_site_content', input: { url: 'https://example.com' } },
             { type: 'tool_use', id: 'call-b', name: 'fetch_site_content', input: { url: 'https://example.org' } }]
          : [{ type: 'text', text: 'Grounded answer' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }) } as Response;
    });
    const executeTool = vi.fn(async () => ({ evidence: 'fixture' }));
    try {
      const result = await executeAgentReActLoop({
        agentName: 'Evidence Collector', goal: 'Read public evidence', scopedContext: 'Synthetic context',
        config: { provider: 'anthropic', model: 'claude-test', apiKey: 'saved-anthropic-key' },
        allowedTools: ['fetch_site_content'], executeTool,
      });
      expect(result.output).toBe('Grounded answer');
      expect(result.totalTokens).toBe(30);
      expect(executeTool).toHaveBeenCalledTimes(2);
      expect(bodies[0].tools[0]).toHaveProperty('input_schema');
      expect(bodies[1].messages.at(-1)).toMatchObject({ role: 'user', content: [
        { type: 'tool_result', tool_use_id: 'call-a' }, { type: 'tool_result', tool_use_id: 'call-b' },
      ] });
    } finally { globalThis.fetch = originalFetch; }
  });

  it.each(['xai', 'glm', 'omniroute', 'opencode', 'opusmax', 'openrouter', 'deepseek', 'qwen', 'openai'] as const)(
    'uses explicit saved credentials and base URL for %s', async provider => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async (url, options) => {
        expect(url).toBe('https://approved.example/v1/chat/completions');
        expect(options?.headers).toMatchObject({ Authorization: 'Bearer provider-specific-key' });
        return { ok: true, json: async () => ({ choices: [{ message: { role: 'assistant', content: 'Done' } }] }) } as Response;
      });
      try {
        const result = await executeAgentReActLoop({ agentName: 'Test', goal: 'Test', scopedContext: '',
          config: { provider, model: 'test-model', apiKey: 'provider-specific-key', baseUrl: 'https://approved.example/v1' },
          allowedTools: [], executeTool: vi.fn(),
        });
        expect(result.providerUsed).toBe(provider);
        expect(result.output).toBe('Done');
      } finally { globalThis.fetch = originalFetch; }
    },
  );

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
        allowedTools: ["fetch_site_content"],
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
        allowedTools: [],
        executeTool: async () => ({}),
      });

      expect(result.output).toBe("Strategic plan completed.");
      expect(result.detailedSteps.length).toBe(1);
      expect(result.detailedSteps[0].action).toBe("final_response");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("exposes only mission-authorized tools to an OpenAI-compatible model", async () => {
    const originalFetch = globalThis.fetch;
    let advertisedTools: string[] = [];
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: any) => {
      const body = JSON.parse(opts.body);
      advertisedTools = body.tools.map((tool: any) => tool.function.name);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { role: "assistant", content: "Done." } }],
          usage: { prompt_tokens: 10, completion_tokens: 2 },
        }),
      };
    });

    try {
      await executeAgentReActLoop({
        agentName: "Evidence Collector",
        goal: "Collect public evidence",
        scopedContext: "Public sources only",
        config: { provider: "ollama", model: "qwen2.5:14b" },
        allowedTools: ["fetch_site_content"],
        executeTool: async () => ({}),
      });
      expect(advertisedTools).toEqual(["fetch_site_content"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("blocks a model-requested tool that is outside the mission grant", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{
          message: {
            role: "assistant",
            content: null,
            tool_calls: [{
              id: "forbidden-1",
              type: "function",
              function: { name: "run_sandboxed_command", arguments: '{"command":"pwd"}' },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 2 },
      }),
    });
    const executeTool = vi.fn();

    try {
      await expect(executeAgentReActLoop({
        agentName: "Evidence Collector",
        goal: "Collect public evidence",
        scopedContext: "Public sources only",
        config: { provider: "ollama", model: "qwen2.5:14b" },
        maxSteps: 1,
        allowedTools: ["fetch_site_content"],
        executeTool,
      })).rejects.toThrow(/not authorized/i);
      expect(executeTool).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("marks result as exhausted when maxSteps is reached without final completion, avoiding false success (C-09)", async () => {
    const originalFetch = globalThis.fetch;
    // Mock response that perpetually asks for tool calls without providing a final response
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{
          message: {
            role: "assistant",
            content: null,
            tool_calls: [{
              id: "call-repeat",
              type: "function",
              function: { name: "fetch_site_content", arguments: '{"url":"https://example.com"}' },
            }],
          },
        }],
        usage: { prompt_tokens: 15, completion_tokens: 5 },
      }),
    });

    try {
      const result = await executeAgentReActLoop({
        agentName: "Auditor",
        goal: "Perform audit",
        scopedContext: "Context",
        config: { provider: "ollama", model: "qwen2.5:14b" },
        maxSteps: 2,
        allowedTools: ["fetch_site_content"],
        executeTool: async () => ({ content: "example content" }),
      });

      expect(result.status).toBe("exhausted");
      expect(result.output).toMatch(/Mission incomplete: allocated tool execution budget exhausted/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
