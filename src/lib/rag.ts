import { GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";

// Real Second Brain storage + retrieval backbone. Every module that produces
// durable insight (audits, discovery notes, competitor scans, uploaded files)
// writes a row here via saveDocument(); anything that generates AI output
// with business context (audits, content drafts, agent runs) can pull
// relevant context back via searchDocuments() before prompting Gemini —
// this is what makes "generation anchors to Second Brain context" literally
// true instead of aspirational.
//
// 768-dim (Gemini text-embedding-004), deliberately not the dead 1536-dim
// voice_embedding/persona_embedding columns on brand_vault/customer_vault —
// nothing ever wrote to those, so there's no migration debt to carry forward,
// and 768 matches what this embedding call actually returns.

const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIM = 768;

let embedClient: GoogleGenAI | null = null;
function getEmbedClient(): GoogleGenAI {
  if (!embedClient) {
    embedClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "MOCK_KEY" });
  }
  return embedClient;
}

// Null (not throw) when no real key is set or the call fails — callers treat
// a null embedding as "store the text, skip semantic search for this row",
// same soft-degrade pattern used for every other Gemini call in this app.
export async function embedText(text: string): Promise<number[] | null> {
  if (!process.env.GEMINI_API_KEY || !text?.trim()) return null;
  try {
    const response = await getEmbedClient().models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [text.slice(0, 20000)], // keep well under the model's input ceiling
      config: { outputDimensionality: EMBEDDING_DIM },
    });
    const values = response.embeddings?.[0]?.values;
    return values && values.length === EMBEDDING_DIM ? values : null;
  } catch (err) {
    console.error("embedText failed:", err);
    return null;
  }
}

export interface SaveDocumentInput {
  workspaceId: string;
  vaultId: string;         // which Second Brain vault this belongs under (brand/customer/operations/general/...)
  sourceModule: string;    // which feature produced it (growth_audit, uiux_audit, performance_notes, ...)
  fileName: string;
  storagePath?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  contentText?: string | null;
}

// Writes the document row and, when there's real text to embed, its vector —
// callers don't need to sequence embedText() themselves.
export async function saveDocument(sb: SupabaseClient, input: SaveDocumentInput): Promise<string> {
  const embedding = input.contentText ? await embedText(input.contentText) : null;
  const { data, error } = await sb
    .from("documents")
    .insert({
      workspace_id: input.workspaceId,
      vault_id: input.vaultId,
      source_module: input.sourceModule,
      file_name: input.fileName,
      storage_path: input.storagePath ?? null,
      mime_type: input.mimeType ?? null,
      size_bytes: input.sizeBytes ?? null,
      content_text: input.contentText ?? null,
      embedding,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export interface SearchDocumentsOptions {
  vaultId?: string;
  // Restrict retrieval to these document vault_ids. Used by agent runs to keep
  // RAG inside the agent's authorized scope — see documentVaultIdsForScope()
  // in agentPolicies.ts. An EMPTY array means "no vaults authorized" and
  // correctly matches nothing; undefined means unrestricted (a human search).
  vaultIds?: string[];
  topK?: number;
}

export interface DocumentMatch {
  id: string;
  fileName: string;
  vaultId: string;
  sourceModule: string;
  contentText: string | null;
  similarity: number;
}

// Cosine-similarity search via pgvector's <=> operator (distance; similarity
// = 1 - distance). RLS on `documents` already scopes this to the caller's
// workspace — no workspace_id filter needed beyond what RLS enforces, but we
// pass it explicitly anyway so the query plan can use idx_documents_ws.
export async function searchDocuments(
  sb: SupabaseClient,
  workspaceId: string,
  queryText: string,
  opts: SearchDocumentsOptions = {},
): Promise<DocumentMatch[]> {
  const queryEmbedding = await embedText(queryText);
  if (!queryEmbedding) return [];

  // Two RPCs, chosen by which restriction the caller expressed. The array
  // variant (migration 0013) exists because an agent's scope is several vaults
  // and match_documents only takes one — calling it per-vault and merging would
  // break top-K ordering, since each call returns its own K.
  const { data, error } = opts.vaultIds
    ? await sb.rpc("match_documents_scoped", {
        p_workspace_id: workspaceId,
        p_vault_ids: opts.vaultIds,
        p_query_embedding: queryEmbedding,
        p_match_count: opts.topK ?? 5,
      })
    : await sb.rpc("match_documents", {
        p_workspace_id: workspaceId,
        p_vault_id: opts.vaultId ?? null,
        p_query_embedding: queryEmbedding,
        p_match_count: opts.topK ?? 5,
      });
  if (error) {
    console.error("searchDocuments RPC failed:", error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    fileName: row.file_name,
    vaultId: row.vault_id,
    sourceModule: row.source_module,
    contentText: row.content_text,
    similarity: row.similarity,
  }));
}

// Saves a high-performing ad copy hook into pgvector memory for RAG retrieval
export async function indexPerformanceHook(
  sb: SupabaseClient,
  workspaceId: string,
  hookText: string,
  channel?: string,
  metricSummary?: string,
): Promise<string> {
  const fileName = `winning_hook_${Date.now()}.txt`;
  const contentText = `[Winning Ad Hook - Channel: ${channel || "General"}] ${metricSummary ? `[Performance: ${metricSummary}] ` : ""}${hookText}`;
  return saveDocument(sb, {
    workspaceId,
    vaultId: "marketing",
    sourceModule: "performance_hooks",
    fileName,
    contentText,
  });
}

