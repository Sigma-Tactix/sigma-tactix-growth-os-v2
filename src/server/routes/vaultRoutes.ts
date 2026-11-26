import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { canonicalDocumentVaultId } from '../../lib/secondBrainDocuments.js';
import { saveDocument, searchDocuments } from '../../lib/rag.js';
import { upload } from '../multerUpload.js';

// ---------------------------------------------------------------------------
// Second Brain file storage — skill-file upload, vault file upload /
// documents / semantic search / document analysis, and short-lived signed
// download URLs.
//
// Extracted from server.ts (P2 increment 10 of the router-extraction
// program, see docs/OPTIMIZATION_AUDIT.md). The single 20 MB multer
// instance is shared via ../multerUpload.js so the later performance
// extraction reuses the same config. The in-file Gemini helpers
// (getGeminiClient / resolveEffectiveGeminiKey) are INJECTED; they stay in
// server.ts, which owns them. Mounted under /api/workspace AFTER the
// global app.use("/api/workspace", requireAuth), so auth + RLS semantics
// are unchanged.
// ---------------------------------------------------------------------------

export interface VaultRouterDeps {
  getDB: (res: Response) => Promise<import('../../types.js').WorkspaceData>;
  saveDB: (res: Response, data: import('../../types.js').WorkspaceData) => Promise<void>;
  getGeminiClient: (key?: string) => any;
  resolveEffectiveGeminiKey: (res: Response) => Promise<string | undefined>;
}

export function createVaultRouter(deps: VaultRouterDeps): Router {
  const router = Router();
  const { getDB, saveDB, getGeminiClient, resolveEffectiveGeminiKey } = deps;

router.post('/settings/skills/upload', upload.single("file"), async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  const moduleKey = (req.body?.moduleKey || "").trim();
  if (!file) {
    res.status(400).json({ error: "A file is required." });
    return;
  }
  if (!moduleKey) {
    res.status(400).json({ error: "moduleKey is required." });
    return;
  }
  if (!/\.(md|txt)$/i.test(file.originalname)) {
    res.status(400).json({ error: "Only .md or .txt skill files are supported." });
    return;
  }
  const content = file.buffer.toString("utf8");
  if (!content.trim()) {
    res.status(400).json({ error: "That file is empty." });
    return;
  }
  const db = await getDB(res);
  db.settings = db.settings || ({} as any);
  db.settings.skills = db.settings.skills || [];
  const skill = {
    id: "skill-" + Date.now(),
    name: (req.body?.name || "").trim() || file.originalname.replace(/\.(md|txt)$/i, ""),
    moduleKey,
    enabled: true,
    content,
    fileName: file.originalname,
  };
  db.settings.skills.push(skill);
  await saveDB(res, db);
  res.json({ success: true, skill });
});

router.post('/vault/upload', upload.single("file"), async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  const vaultId = canonicalDocumentVaultId((req.body?.vaultId as string) || "general");
  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }
  if (/\.(xlsx|xls)$/i.test(file.originalname)) {
    res.status(415).json({
      error: "Spreadsheet uploads are temporarily unavailable while the workbook parser is under security remediation. Upload CSV or export the workbook to PDF/text instead.",
      code: "SPREADSHEET_INGESTION_QUARANTINED",
    });
    return;
  }

  const db = await getDB(res);
  const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const duplicate = (db.secondBrain.uploadedFiles || []).find(f => f.sha256 === sha256);
  if (duplicate) {
    res.status(409).json({ error: "This exact file has already been uploaded.", file: duplicate, code: 'DUPLICATE_FILE' });
    return;
  }
  const storagePath = `${res.locals.wsId}/${vaultId}/${crypto.randomUUID()}-${file.originalname}`;

  const { error: uploadErr } = await res.locals.sb.storage
    .from("vault-files")
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uploadErr) {
    res.status(500).json({ error: "Storage upload failed: " + uploadErr.message });
    return;
  }

  let contentText: string | undefined;
  const lower = file.originalname.toLowerCase();
  if (file.mimetype.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".csv") || lower.endsWith(".json")) {
    contentText = file.buffer.toString("utf8").slice(0, 50000);
  } else if (file.mimetype === "application/pdf" || lower.endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: file.buffer });
      const result = await parser.getText();
      contentText = result.text.slice(0, 50000);
    } catch (err) {
      console.error("PDF text extraction failed (file still stored):", err);
    }
  }
  // docx/images: stored above, but not text-extracted — status stays
  // 'Processing' below rather than silently claiming they're RAG-ready.

  let documentId: string | undefined;
  let vectorIndexed = false;
  try {
    documentId = await saveDocument(res.locals.sb, {
      workspaceId: res.locals.wsId,
      vaultId,
      sourceModule: "brain_upload",
      fileName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      contentText,
    });
    const { data: documentRow, error: documentReadError } = await res.locals.sb
      .from("documents")
      .select("embedding")
      .eq("id", documentId)
      .eq("workspace_id", res.locals.wsId)
      .maybeSingle();
    if (documentReadError) {
      console.error("Unable to confirm document index state:", documentReadError.message);
    } else {
      vectorIndexed = documentRow?.embedding != null;
    }
  } catch (err) {
    console.error("saveDocument failed (file bytes are still safely stored):", err);
  }

  const newFile = {
    id: "f-" + Date.now(),
    name: file.originalname,
    size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
    uploadedAt: new Date().toISOString().split("T")[0],
    vaultId,
    status: (documentId ? (vectorIndexed ? "Indexed" : "Stored") : "Processing") as "Indexed" | "Stored" | "Processing",
    storagePath,
    documentId,
    mimeType: file.mimetype,
    sha256,
    vectorIndexed,
  };
  db.secondBrain.uploadedFiles = [...(db.secondBrain.uploadedFiles || []), newFile];
  await saveDB(res, db);
  res.json({ success: true, file: newFile, secondBrain: db.secondBrain });
});

// The vault screen must be rebuilt from durable rows on every load. The
// workspace-scoped Supabase client retains RLS protection; we deliberately do
// not return raw embeddings to the browser.
router.get('/vault/documents', async (_req: Request, res: Response) => {
  const { data, error } = await res.locals.sb
    .from("documents")
    .select("id, vault_id, source_module, file_name, storage_path, mime_type, size_bytes, content_text, embedding, created_at")
    .eq("workspace_id", res.locals.wsId)
    .order("created_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: "Could not load workspace documents: " + error.message });
    return;
  }

  const db = await getDB(res);
  const filesByDocumentId = new Map(
    (db.secondBrain.uploadedFiles || [])
      .filter((file) => Boolean(file.documentId))
      .map((file) => [file.documentId as string, file.id]),
  );
  const documents = (data || []).map((row: any) => ({
    id: row.id,
    vaultId: row.vault_id,
    sourceModule: row.source_module,
    fileName: row.file_name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    contentText: row.content_text,
    vectorIndexed: row.embedding != null,
    createdAt: row.created_at,
    uploadedFileId: filesByDocumentId.get(row.id) || null,
  }));
  res.json({ success: true, documents });
});

// Semantic search is only available when the configured embedding provider
// and pgvector RPC are healthy. An empty result is an honest unavailable/no
// match state, never a locally invented relevance score.
router.post('/vault/search', async (req: Request, res: Response) => {
  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
  if (!query) {
    res.status(400).json({ error: "A search query is required." });
    return;
  }
  if (query.length > 2_000) {
    res.status(400).json({ error: "Search query exceeds the 2,000 character limit." });
    return;
  }
  const matches = await searchDocuments(res.locals.sb, res.locals.wsId, query, { topK: 6 });
  res.json({ success: true, matches });
});

// Analyze and summarize uploaded document for auto-filling Second Brain Vault Records
router.post('/vault/analyze-document', upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    let rawText = "";
    let fileName = "Uploaded Document";
    let fileSize = 0;
    let mimeType = "text/plain";

    if (file) {
      fileName = file.originalname;
      fileSize = file.size;
      mimeType = file.mimetype;
      const lower = fileName.toLowerCase();

      if (/\.(xlsx|xls)$/i.test(lower)) {
        res.status(415).json({
          error: "Spreadsheet analysis is temporarily unavailable while the workbook parser is under security remediation. Upload CSV or export the workbook to PDF/text instead.",
          code: "SPREADSHEET_INGESTION_QUARANTINED",
        });
        return;
      }

      if (
        mimeType.startsWith("text/") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".md") ||
        lower.endsWith(".json") ||
        lower.endsWith(".csv") ||
        lower.endsWith(".yaml") ||
        lower.endsWith(".yml") ||
        lower.endsWith(".xml") ||
        lower.endsWith(".html") ||
        lower.endsWith(".ts") ||
        lower.endsWith(".js")
      ) {
        rawText = file.buffer.toString("utf8");
      } else if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
        try {
          const { PDFParse } = await import("pdf-parse");
          const parser = new PDFParse({ data: file.buffer });
          const result = await parser.getText();
          rawText = result.text;
        } catch (err: any) {
          console.warn("PDF extraction fallback:", err.message);
          rawText = file.buffer.toString("utf8", 0, Math.min(file.buffer.length, 10000)).replace(/[^\x20-\x7E\n\r\t]/g, " ");
        }
      } else {
        rawText = file.buffer.toString("utf8").replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
      }
    } else if (req.body?.text) {
      rawText = String(req.body.text);
      fileName = String(req.body.fileName || "Pasted Document");
      fileSize = Buffer.byteLength(rawText, "utf8");
    }

    if (!rawText.trim()) {
      res.status(400).json({ error: "Could not extract readable text from uploaded document" });
      return;
    }

    const analysisSnippet = rawText.slice(0, 15000);

    const generateFallbackAnalysis = (text: string, fName: string) => {
      const cleanName = fName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      const firstHeading = lines.find(l => l.startsWith("#") || (l.length > 5 && l.length < 80)) || cleanName;
      const detectedTitle = firstHeading.replace(/^#+\s*/, "").slice(0, 80) || cleanName;

      let category = "Strategic Intelligence";
      const lower = text.toLowerCase();
      if (lower.includes("financial") || lower.includes("cac") || lower.includes("revenue") || lower.includes("roi") || lower.includes("spend") || lower.includes("budget")) {
        category = "Financial Model & Growth Metrics";
      } else if (lower.includes("audit") || lower.includes("cro") || lower.includes("performance") || lower.includes("seo") || lower.includes("aeo")) {
        category = "Audit & CRO Diagnostics";
      } else if (lower.includes("brand") || lower.includes("icp") || lower.includes("persona") || lower.includes("positioning") || lower.includes("tone")) {
        category = "Brand Voice & ICP";
      } else if (lower.includes("architecture") || lower.includes("api") || lower.includes("database") || lower.includes("vector") || lower.includes("schema")) {
        category = "Technical Architecture";
      } else if (lower.includes("strategy") || lower.includes("executive") || lower.includes("roadmap") || lower.includes("okr")) {
        category = "Strategic Playbook";
      }

      let classification: "STRATEGIC_CORE" | "OPERATIONAL_PUBLIC" | "RESTRICTED_C_LEVEL" | "AUDIT_DIAGNOSTIC" = "STRATEGIC_CORE";
      if (lower.includes("c-level") || lower.includes("confidential") || lower.includes("secret") || lower.includes("board")) {
        classification = "RESTRICTED_C_LEVEL";
      } else if (lower.includes("audit") || lower.includes("diagnostic") || lower.includes("benchmark")) {
        classification = "AUDIT_DIAGNOSTIC";
      } else if (lower.includes("public") || lower.includes("operational") || lower.includes("guideline")) {
        classification = "OPERATIONAL_PUBLIC";
      }

      const summaryLines = lines.slice(0, 3).join(" ").slice(0, 260);
      const summary = summaryLines.length > 20 ? summaryLines + "..." : "Authoritative corporate knowledge record extracted for strategic grounding and pgvector search.";

      const potentialTags = ["Growth", "Strategy", "Analytics", "Operations", "AI", "Audit", "Performance", "CRO", "Architecture", "Playbook"];
      const matchedTags = potentialTags.filter(t => lower.includes(t.toLowerCase()));
      const tags = matchedTags.length > 0 ? matchedTags.slice(0, 5) : ["Knowledge", "Ingest", "Vault"];

      return {
        title: detectedTitle,
        category,
        classification,
        summary,
        content: text,
        tags
      };
    };

    let result = generateFallbackAnalysis(rawText, fileName);

    const apiKey = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MOCK_KEY") {
      try {
        const client = getGeminiClient(apiKey);
        const prompt = `You are the Senior Intelligence Archivist for SigmaTactix Growth OS.
Analyze the following uploaded document and synthesize its attributes to auto-populate a Second Brain Vault Record.

Document Filename: "${fileName}"
Document Content:
"""
${analysisSnippet}
"""

Return ONLY a raw, valid JSON object without markdown fences matching this exact schema:
{
  "title": "Clear, authoritative corporate title (e.g. 'Q4 Target CAC & Audience Expansion Specs')",
  "category": "High level functional domain (e.g. 'Performance Strategy', 'Audit Diagnostics', 'Brand Voice', 'Technical Architecture')",
  "classification": "One of exactly: 'STRATEGIC_CORE', 'OPERATIONAL_PUBLIC', 'RESTRICTED_C_LEVEL', 'AUDIT_DIAGNOSTIC'",
  "summary": "2-3 sentence executive summary capturing the core premise and tactical value of this file",
  "tags": ["Array of 3 to 6 semantic tags as clean strings without #"]
}`;

        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });

        const cleaned = (response.text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.title && parsed.summary) {
          result = {
            title: String(parsed.title).trim(),
            category: String(parsed.category || result.category).trim(),
            classification: ["STRATEGIC_CORE", "OPERATIONAL_PUBLIC", "RESTRICTED_C_LEVEL", "AUDIT_DIAGNOSTIC"].includes(parsed.classification)
              ? parsed.classification
              : result.classification,
            summary: String(parsed.summary).trim(),
            content: rawText,
            tags: Array.isArray(parsed.tags) && parsed.tags.length > 0
              ? parsed.tags.map((t: any) => String(t).replace(/^#/, "").trim()).filter(Boolean)
              : result.tags
          };
        }
      } catch (err: any) {
        console.warn("Live Gemini document analysis failed, falling back to heuristic:", err.message);
      }
    }

    res.json({
      success: true,
      analysis: result,
      fileName,
      fileSize: (fileSize / 1024).toFixed(1) + " KB",
      mimeType
    });
  } catch (err: any) {
    console.error("Document analysis error:", err);
    res.status(500).json({ error: "Failed to analyze document: " + (err?.message || "Unknown error") });
  }
});

// Retrieve an uploaded file — a short-lived signed URL into the private
// bucket. This is the "click a file to open it" action the graph never had.
router.get('/vault/files/:fileId/url', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const db = await getDB(res);
  const file = (db.secondBrain.uploadedFiles || []).find(f => f.id === fileId);
  if (!file || !file.storagePath) {
    res.status(404).json({ error: "File not found or was never stored (pre-migration record)" });
    return;
  }
  const { data, error } = await res.locals.sb.storage.from("vault-files").createSignedUrl(file.storagePath, 300);
  if (error || !data) {
    res.status(500).json({ error: "Could not create signed URL: " + (error?.message || "unknown error") });
    return;
  }
  res.json({ success: true, url: data.signedUrl });
});

// Delete an uploaded file — removes the Storage object and its documents
// row (RAG index), not just the metadata entry.
router.delete('/vault/files/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const db = await getDB(res);
  const file = (db.secondBrain.uploadedFiles || []).find(f => f.id === fileId);
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  if (file.storagePath) {
    const { error } = await res.locals.sb.storage.from("vault-files").remove([file.storagePath]);
    if (error) console.error("Storage object delete failed (continuing to remove the record):", error);
  }
  if (file.documentId) {
    const { error } = await res.locals.sb.from("documents").delete().eq("id", file.documentId);
    if (error) console.error("documents row delete failed (continuing):", error);
  }

  db.secondBrain.uploadedFiles = (db.secondBrain.uploadedFiles || []).filter(f => f.id !== fileId);
  await saveDB(res, db);
  res.json({ success: true, secondBrain: db.secondBrain });
});

  return router;
}
