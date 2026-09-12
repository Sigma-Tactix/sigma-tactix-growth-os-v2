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
];

export interface ToolCallExecutionInput {
  name: string;
  args: Record<string, any>;
  sb?: SupabaseClient;
  workspaceId?: string;
  secondBrain?: any;
}

// Executes tool calls requested by Gemini during agent execution
export async function executeAgentToolCall(input: ToolCallExecutionInput): Promise<any> {
  const { name, args, sb, workspaceId, secondBrain } = input;

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

    return { error: `Unknown tool name: ${name}` };
  } catch (err: any) {
    return { error: `Tool execution failed: ${err.message || String(err)}` };
  }
}
