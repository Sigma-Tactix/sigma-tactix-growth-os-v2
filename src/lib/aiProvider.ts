import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { GROWTH_OS_AGENT_TOOLS, GROWTH_OS_OPENAI_TOOLS, OpenAIToolDefinition } from "./agentTools.js";
import { calculateTokenCost, estimateTokens, ALL_AI_MODELS } from "./tokenCostEngine.js";

export type SupportedProvider =
  | "gemini"
  | "google"
  | "ollama"
  | "lmstudio"
  | "openai"
  | "anthropic"
  | "deepseek"
  | "qwen"
  | "openrouter";

export interface AIProviderConfig {
  provider: SupportedProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface ReActStep {
  stepNumber: number;
  action: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  toolResult?: any;
  observation: string;
  durationMs: number;
}

export interface ReActExecutionResult {
  output: string;
  steps: string[];
  detailedSteps: ReActStep[];
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  providerUsed: SupportedProvider;
  modelUsed: string;
  durationMs: number;
}

/**
 * Resolves standard OpenAI-compatible base URLs for local or hosted providers
 */
export function resolveProviderBaseUrl(provider: SupportedProvider, explicitBaseUrl?: string): string {
  if (explicitBaseUrl?.trim()) return explicitBaseUrl.trim().replace(/\/$/, "");

  switch (provider) {
    case "ollama":
      return (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1").replace(/\/$/, "");
    case "lmstudio":
      return (process.env.LMSTUDIO_BASE_URL || "http://127.0.0.1:1234/v1").replace(/\/$/, "");
    case "deepseek":
      return (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1").replace(/\/$/, "");
    case "qwen":
      return (process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "");
    case "openrouter":
      return (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
    case "openai":
    default:
      return (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  }
}

/**
 * Executes a multi-turn ReAct loop for an agent using either a local model (Ollama / LM Studio)
 * or cloud models (Gemini / OpenAI / DeepSeek), executing real tools along the way.
 */
export async function executeAgentReActLoop(params: {
  agentName: string;
  goal: string;
  scopedContext: string;
  config: AIProviderConfig;
  maxSteps?: number;
  executeTool: (name: string, args: Record<string, any>) => Promise<any>;
  geminiClientFactory?: (key?: string) => GoogleGenAI;
}): Promise<ReActExecutionResult> {
  const {
    agentName,
    goal,
    scopedContext,
    config,
    maxSteps = 5,
    executeTool,
    geminiClientFactory,
  } = params;

  const startedAt = Date.now();
  const detailedSteps: ReActStep[] = [];
  const logSteps: string[] = [];

  const isGemini = config.provider === "gemini" || config.provider === "google";

  if (isGemini) {
    return await executeGeminiReActLoop({
      agentName,
      goal,
      scopedContext,
      config,
      maxSteps,
      executeTool,
      geminiClientFactory,
      startedAt,
      detailedSteps,
      logSteps,
    });
  }

  return await executeOpenAICompatibleReActLoop({
    agentName,
    goal,
    scopedContext,
    config,
    maxSteps,
    executeTool,
    startedAt,
    detailedSteps,
    logSteps,
  });
}

/**
 * Multi-turn execution loop using OpenAI-compatible endpoint (Ollama, LM Studio, vLLM, OpenAI, DeepSeek)
 */
async function executeOpenAICompatibleReActLoop(ctx: {
  agentName: string;
  goal: string;
  scopedContext: string;
  config: AIProviderConfig;
  maxSteps: number;
  executeTool: (name: string, args: Record<string, any>) => Promise<any>;
  startedAt: number;
  detailedSteps: ReActStep[];
  logSteps: string[];
}): Promise<ReActExecutionResult> {
  const { agentName, goal, scopedContext, config, maxSteps, executeTool, startedAt, detailedSteps, logSteps } = ctx;

  const baseUrl = resolveProviderBaseUrl(config.provider, config.baseUrl);
  const apiKey = config.apiKey || (config.provider === "ollama" || config.provider === "lmstudio" ? "local" : process.env.OPENAI_API_KEY || "");
  const model = config.model;

  const systemPrompt = `You are the elite "${agentName}" autonomous agent inside Sigma Tactix Growth OS.
Your objective: "${goal}"

Authorized Second Brain & Context:
${scopedContext}

Operational Directives:
1. Ground every claim and artifact in authorized context.
2. When you need real website facts, files, or data, call your tools (fetch_site_content, run_sandboxed_command, read_workspace_file, write_workspace_file, http_request).
3. When your mission is fulfilled, deliver a structured, comprehensive markdown artifact summarizing results, findings, and deliverables.`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Execute the following task thoroughly: "${goal}"` },
  ];

  let promptTokens = 0;
  let candidateTokens = 0;
  let finalOutput = "";

  logSteps.push(`Starting autonomous ReAct loop with ${config.provider} (${model}) at ${baseUrl}.`);

  for (let step = 1; step <= maxSteps; step++) {
    const stepStart = Date.now();
    const reqBody = {
      model,
      messages,
      tools: GROWTH_OS_OPENAI_TOOLS,
      tool_choice: "auto",
      temperature: 0.2,
    };

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(reqBody),
        signal: AbortSignal.timeout(config.timeoutMs || 90_000),
      });
    } catch (err: any) {
      throw new Error(`Failed to communicate with ${config.provider} model endpoint (${baseUrl}): ${err.message}`);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${config.provider} API error (${res.status}): ${errText.slice(0, 500)}`);
    }

    const data = await res.json() as any;
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (data.usage) {
      promptTokens += data.usage.prompt_tokens || 0;
      candidateTokens += data.usage.completion_tokens || 0;
    }

    if (!message) {
      throw new Error("No response message returned from model provider.");
    }

    messages.push(message);

    // If model requested tool calls, execute them
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const call of message.tool_calls) {
        const fnName = call.function?.name;
        let fnArgs: Record<string, any> = {};
        try {
          fnArgs = JSON.parse(call.function?.arguments || "{}");
        } catch {
          fnArgs = {};
        }

        logSteps.push(`Step ${step}: Agent called tool "${fnName}" with args: ${JSON.stringify(fnArgs).slice(0, 150)}`);

        const toolStart = Date.now();
        const toolResult = await executeTool(fnName, fnArgs);
        const toolDuration = Date.now() - toolStart;

        detailedSteps.push({
          stepNumber: step,
          action: `tool_call:${fnName}`,
          toolName: fnName,
          toolArgs: fnArgs,
          toolResult,
          observation: JSON.stringify(toolResult).slice(0, 500),
          durationMs: toolDuration,
        });

        logSteps.push(`Step ${step} result for "${fnName}": ${JSON.stringify(toolResult).slice(0, 200)}... (${toolDuration}ms)`);

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: fnName,
          content: JSON.stringify(toolResult),
        });
      }
    } else {
      // Final text output achieved
      finalOutput = message.content || "";
      detailedSteps.push({
        stepNumber: step,
        action: "final_response",
        observation: "Completed mission output.",
        durationMs: Date.now() - stepStart,
      });
      logSteps.push(`Step ${step}: Agent finalized mission deliverable.`);
      break;
    }
  }

  // If max steps reached without concluding
  if (!finalOutput) {
    const lastMsg = messages[messages.length - 1];
    finalOutput = lastMsg?.content || "Mission completed within allocated tool execution budget.";
  }

  const durationMs = Date.now() - startedAt;
  const totalTokens = promptTokens + candidateTokens;
  const isLocal = config.provider === "ollama" || config.provider === "lmstudio";
  const estimatedCostUsd = isLocal ? 0 : calculateTokenCost(model, promptTokens, candidateTokens);

  return {
    output: finalOutput,
    steps: logSteps,
    detailedSteps,
    promptTokens,
    candidateTokens,
    totalTokens,
    estimatedCostUsd,
    providerUsed: config.provider,
    modelUsed: model,
    durationMs,
  };
}

/**
 * Multi-turn execution loop using Google Gemini SDK
 */
async function executeGeminiReActLoop(ctx: {
  agentName: string;
  goal: string;
  scopedContext: string;
  config: AIProviderConfig;
  maxSteps: number;
  executeTool: (name: string, args: Record<string, any>) => Promise<any>;
  geminiClientFactory?: (key?: string) => GoogleGenAI;
  startedAt: number;
  detailedSteps: ReActStep[];
  logSteps: string[];
}): Promise<ReActExecutionResult> {
  const { agentName, goal, scopedContext, config, maxSteps, executeTool, geminiClientFactory, startedAt, detailedSteps, logSteps } = ctx;

  const client = geminiClientFactory ? geminiClientFactory(config.apiKey) : new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY || "MOCK_KEY" });
  const model = config.model;

  const systemInstruction = `You are the elite "${agentName}" autonomous agent inside Sigma Tactix Growth OS.
Your objective: "${goal}"

Authorized Second Brain & Performance Context:
${scopedContext}

Operational Directives:
1. Ground every claim and artifact in authorized context.
2. Use tools whenever you need live site content, files, or system data.
3. Deliver a comprehensive structured markdown deliverable upon completion.`;

  logSteps.push(`Starting Gemini ReAct execution with ${model} and active Growth OS tools.`);

  let promptTokens = 0;
  let candidateTokens = 0;
  let finalOutput = "";

  // Gemini contents history
  const contents: any[] = [
    { role: "user", parts: [{ text: `Execute the following task thoroughly: "${goal}"` }] }
  ];

  for (let step = 1; step <= maxSteps; step++) {
    const stepStart = Date.now();

    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: GROWTH_OS_AGENT_TOOLS }],
        temperature: 0.2,
        abortSignal: AbortSignal.timeout(config.timeoutMs || 90_000),
      },
    });

    const usage = (response as any).usageMetadata;
    if (usage) {
      promptTokens += usage.promptTokenCount || 0;
      candidateTokens += usage.candidatesTokenCount || 0;
    }

    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      // Add model's function call response into history
      contents.push({
        role: "model",
        parts: functionCalls.map(fc => ({ functionCall: fc })),
      });

      const responseParts: any[] = [];
      for (const fc of functionCalls) {
        const fnName = fc.name;
        const fnArgs = (fc.args as Record<string, any>) || {};

        logSteps.push(`Step ${step}: Agent called tool "${fnName}" with args: ${JSON.stringify(fnArgs).slice(0, 150)}`);

        const toolStart = Date.now();
        const toolResult = await executeTool(fnName, fnArgs);
        const toolDuration = Date.now() - toolStart;

        detailedSteps.push({
          stepNumber: step,
          action: `tool_call:${fnName}`,
          toolName: fnName,
          toolArgs: fnArgs,
          toolResult,
          observation: JSON.stringify(toolResult).slice(0, 500),
          durationMs: toolDuration,
        });

        logSteps.push(`Step ${step} result for "${fnName}": ${JSON.stringify(toolResult).slice(0, 200)}... (${toolDuration}ms)`);

        responseParts.push({
          functionResponse: {
            name: fnName,
            response: { output: toolResult },
          },
        });
      }

      // Feed tool responses back to model
      contents.push({ role: "user", parts: responseParts });
    } else {
      // Model completed with text
      finalOutput = response.text || "";
      detailedSteps.push({
        stepNumber: step,
        action: "final_response",
        observation: "Completed mission output.",
        durationMs: Date.now() - stepStart,
      });
      logSteps.push(`Step ${step}: Agent finalized mission deliverable.`);
      break;
    }
  }

  if (!finalOutput) {
    finalOutput = "Mission completed within allocated tool execution budget.";
  }

  const durationMs = Date.now() - startedAt;
  const totalTokens = promptTokens + candidateTokens;
  const estimatedCostUsd = calculateTokenCost(model, promptTokens, candidateTokens);

  return {
    output: finalOutput,
    steps: logSteps,
    detailedSteps,
    promptTokens,
    candidateTokens,
    totalTokens,
    estimatedCostUsd,
    providerUsed: "google",
    modelUsed: model,
    durationMs,
  };
}
