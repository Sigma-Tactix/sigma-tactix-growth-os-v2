import { FunctionDeclaration, Type } from "@google/genai";
import { fetchSiteContent } from "./siteFetch.js";
import { searchDocuments } from "./rag.js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Tool declarations exposed to Gemini agents during execution
export const GROWTH_OS_AGENT_TOOLS: FunctionDeclaration[] = [
  {
    name: "fetch_site_content",
    description: "Fetch and extract text, SEO metadata, headings, schema.org tags, and analytics script instrumentation from a live web URL.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "The full absolute HTTP/HTTPS URL of the website to inspect." },
      },
      required: ["url"],
    },
  },
  {
    name: "search_second_brain",
    description: "Search the workspace's pgvector Second Brain memory documents and past winning performance copy hooks using semantic vector search.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "The search query text describing the brand positioning, ICP, or copy hook topic." },
        vaultId: { type: Type.STRING, description: "Optional filter by vault ID (e.g. brand, customer, marketing, operations)." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_connector_status",
    description: "Retrieve the current status of all connected marketing platforms (Google Ads, Meta Ads, HubSpot, Shopify, GA4, etc.).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filterPlatform: { type: Type.STRING, description: "Optional specific platform name to query." },
      },
    },
  },
  {
    name: "run_sandboxed_command",
    description: "Execute a shell/terminal command inside the agent's sandboxed environment (OpenBot container or local workspace). Use for running build/data scripts, curl, or checking system tools.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: "The shell command to execute." },
        timeoutSeconds: { type: Type.INTEGER, description: "Optional timeout in seconds (default 30, max 120)." },
      },
      required: ["command"],
    },
  },
  {
    name: "read_workspace_file",
    description: "Read the contents of a file within the workspace or agent output directory.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filePath: { type: Type.STRING, description: "Relative path to the file to read (e.g. 'output/audit.json')." },
      },
      required: ["filePath"],
    },
  },
  {
    name: "write_workspace_file",
    description: "Write or save an agent deliverable, report, code snippet, or ad copy directly to a file in the workspace output directory.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filePath: { type: Type.STRING, description: "Relative path to save the file (e.g. 'output/deliverables/ad_copy.md')." },
        content: { type: Type.STRING, description: "The content text/code/markdown to write." },
      },
      required: ["filePath", "content"],
    },
  },
  {
    name: "http_request",
    description: "Perform an HTTP GET or POST request to fetch live JSON, API data, or scrape public content.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "The absolute HTTP/HTTPS URL to query." },
        method: { type: Type.STRING, description: "HTTP method: GET or POST (default GET)." },
        body: { type: Type.STRING, description: "Optional JSON or string payload for POST requests." },
      },
      required: ["url"],
    },
  },
];

// OpenAI-compatible tool schema format (used by Ollama, vLLM, LM Studio, OpenAI, etc.)
export interface OpenAIToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export const GROWTH_OS_OPENAI_TOOLS: OpenAIToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "fetch_site_content",
      description: "Fetch and extract text, SEO metadata, headings, schema.org tags, and analytics script instrumentation from a live web URL.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The full absolute HTTP/HTTPS URL of the website to inspect." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_second_brain",
      description: "Search the workspace's pgvector Second Brain memory documents and past winning performance copy hooks using semantic vector search.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query text describing the brand positioning, ICP, or copy hook topic." },
          vaultId: { type: "string", description: "Optional filter by vault ID (e.g. brand, customer, marketing, operations)." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_connector_status",
      description: "Retrieve the current status of all connected marketing platforms (Google Ads, Meta Ads, HubSpot, Shopify, GA4, etc.).",
      parameters: {
        type: "object",
        properties: {
          filterPlatform: { type: "string", description: "Optional specific platform name to query." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_sandboxed_command",
      description: "Execute a shell/terminal command inside the agent's sandboxed environment (OpenBot container or local workspace). Use for running build/data scripts, curl, or checking system tools.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The shell command to execute." },
          timeoutSeconds: { type: "number", description: "Optional timeout in seconds (default 30, max 120)." },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_workspace_file",
      description: "Read the contents of a file within the workspace or agent output directory.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Relative path to the file to read (e.g. 'output/audit.json')." },
        },
        required: ["filePath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_workspace_file",
      description: "Write or save an agent deliverable, report, code snippet, or ad copy directly to a file in the workspace output directory.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Relative path to save the file (e.g. 'output/deliverables/ad_copy.md')." },
          content: { type: "string", description: "The content text/code/markdown to write." },
        },
        required: ["filePath", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "http_request",
      description: "Perform an HTTP GET or POST request to fetch live JSON, API data, or scrape public content.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The absolute HTTP/HTTPS URL to query." },
          method: { type: "string", description: "HTTP method: GET or POST (default GET)." },
          body: { type: "string", description: "Optional JSON or string payload for POST requests." },
        },
        required: ["url"],
      },
    },
  },
];

export interface ToolCallExecutionInput {
  name: string;
  args: Record<string, any>;
  sb?: SupabaseClient;
  workspaceId?: string;
  secondBrain?: any;
  workspaceRoot?: string;
}

// Executes tool calls requested by models during agent execution
export async function executeAgentToolCall(input: ToolCallExecutionInput): Promise<any> {
  const { name, args, sb, workspaceId, secondBrain, workspaceRoot = process.cwd() } = input;

  try {
    if (name === "fetch_site_content") {
      const url = args.url as string;
      if (!url) return { error: "Missing required parameter 'url'" };
      const siteData = await fetchSiteContent(url);
      return {
        url: siteData.url,
        title: siteData.title,
        metaDescription: siteData.metaDescription,
        h1s: siteData.h1s.slice(0, 5),
        h2s: siteData.h2s.slice(0, 5),
        analyticsSignals: siteData.analyticsSignals,
        linkCount: siteData.internalLinkCount + siteData.externalLinkCount,
      };
    }

    if (name === "search_second_brain") {
      const query = args.query as string;
      if (!query) return { error: "Missing query parameter" };
      if (!sb || !workspaceId) return { error: "Database context unavailable for vector search" };
      const matches = await searchDocuments(sb, workspaceId, query, { vaultId: args.vaultId, topK: 3 });
      return {
        query,
        matchCount: matches.length,
        results: matches.map(m => ({
          fileName: m.fileName,
          vaultId: m.vaultId,
          snippet: (m.contentText || "").slice(0, 500),
          similarity: m.similarity,
        })),
      };
    }

    if (name === "get_connector_status") {
      if (!secondBrain?.marketingVault?.currentChannels) {
        return { connectedPlatforms: ["Google Ads", "Meta Ads", "Google Analytics 4"] };
      }
      return {
        connectedPlatforms: secondBrain.marketingVault.currentChannels,
        filterPlatform: args.filterPlatform || "all",
      };
    }

    if (name === "run_sandboxed_command") {
      const cmd = (args.command || "").trim();
      if (!cmd) return { error: "Missing command parameter" };

      // High-risk command safety guard
      const blockedPatterns = [/rm\s+-rf\s+\//, /mkfs/, />\s*\/dev\/sd/, /shutdown/, /reboot/];
      if (blockedPatterns.some(p => p.test(cmd))) {
        return { error: "Command blocked by security policy: destructive or privileged pattern detected." };
      }

      // Check for OpenBot container supervisor (e.g. running on OrbStack at :4312)
      const supervisorUrl = process.env.COMPUTER_SUPERVISOR_URL || "http://127.0.0.1:4312";
      const supervisorToken = process.env.COMPUTER_SUPERVISOR_TOKEN;
      try {
        const ping = await fetch(`${supervisorUrl}/health`, { method: "GET", signal: AbortSignal.timeout(1000) });
        if (ping.ok) {
          const resp = await fetch(`${supervisorUrl}/execute`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(supervisorToken ? { Authorization: `Bearer ${supervisorToken}` } : {}),
            },
            body: JSON.stringify({ command: cmd, timeoutSeconds: args.timeoutSeconds || 30 }),
          });
          if (resp.ok) {
            return await resp.json();
          }
        }
      } catch {
        // Supervisor not available; fallback to local workspace execution
      }

      // Local fallback execution via Node child_process
      const { exec } = await import("child_process");
      const timeoutMs = Math.min((args.timeoutSeconds || 30) * 1000, 120_000);

      return await new Promise((resolve) => {
        exec(cmd, { cwd: workspaceRoot, timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
          if (err) {
            resolve({
              exitCode: err.code || 1,
              stdout: stdout?.slice(0, 4000) || "",
              stderr: (stderr || err.message)?.slice(0, 4000),
              success: false,
            });
          } else {
            resolve({
              exitCode: 0,
              stdout: stdout?.slice(0, 4000) || "",
              stderr: stderr?.slice(0, 1000) || "",
              success: true,
            });
          }
        });
      });
    }

    if (name === "read_workspace_file") {
      const filePath = args.filePath as string;
      if (!filePath) return { error: "Missing filePath parameter" };

      const path = await import("path");
      const fs = await import("fs/promises");
      const resolved = path.resolve(workspaceRoot, filePath);

      // Prevent directory traversal out of workspace root
      if (!resolved.startsWith(workspaceRoot)) {
        return { error: "Path traversal out of workspace root is forbidden." };
      }

      try {
        const content = await fs.readFile(resolved, "utf-8");
        return {
          filePath,
          content: content.slice(0, 20_000),
          truncated: content.length > 20_000,
          sizeBytes: content.length,
        };
      } catch (err: any) {
        return { error: `Failed to read file: ${err.message}` };
      }
    }

    if (name === "write_workspace_file") {
      const filePath = args.filePath as string;
      const content = args.content as string;
      if (!filePath || content === undefined) return { error: "Missing filePath or content parameter" };

      const path = await import("path");
      const fs = await import("fs/promises");
      const resolved = path.resolve(workspaceRoot, filePath);

      // Prevent directory traversal out of workspace root
      if (!resolved.startsWith(workspaceRoot)) {
        return { error: "Path traversal out of workspace root is forbidden." };
      }

      try {
        await fs.mkdir(path.dirname(resolved), { recursive: true });
        await fs.writeFile(resolved, content, "utf-8");
        return {
          success: true,
          filePath,
          bytesWritten: Buffer.byteLength(content, "utf-8"),
        };
      } catch (err: any) {
        return { error: `Failed to write file: ${err.message}` };
      }
    }

    if (name === "http_request") {
      const url = args.url as string;
      if (!url) return { error: "Missing url parameter" };
      const method = (args.method || "GET").toUpperCase();

      const resp = await fetch(url, {
        method,
        headers: { "User-Agent": "SigmaTactix-GrowthOS-Agent/2.0" },
        ...(args.body && method === "POST" ? { body: args.body } : {}),
        signal: AbortSignal.timeout(15_000),
      });

      const text = await resp.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text.slice(0, 5000);
      }

      return {
        status: resp.status,
        ok: resp.ok,
        data: parsed,
      };
    }

    return { error: `Unknown tool name: ${name}` };
  } catch (err: any) {
    return { error: `Tool execution failed: ${err.message || String(err)}` };
  }
}
