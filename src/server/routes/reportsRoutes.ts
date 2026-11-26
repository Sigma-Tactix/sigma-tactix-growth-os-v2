import { Router, type Request, type Response } from 'express';
import { validateReportSnapshot } from '../../lib/reportSnapshot.js';
import {
  reportArtifactRepository,
  renderSnapshotToPDF,
  renderSnapshotToPPTX,
  renderSnapshotToXLSX,
  generateReportArtifactBundle,
} from '../../lib/reportArtifactPipeline.js';

// ---------------------------------------------------------------------------
// Reports — saved-report CRUD, the multi-format snapshot renderer (PDF /
// PPTX / XLSX / bundle, persisted through the report-artifact pipeline with
// short-lived signed-URL-style download paths), and the artifact download.
//
// Extracted from server.ts (P2 increment 15 of the router-extraction
// program, see docs/OPTIMIZATION_AUDIT.md). Handler bodies byte-preserved.
// The report-lib surface (snapshot validation + the artifact pipeline)
// imports directly; requireModule stays in server.ts and is INJECTED, so the
// per-route requireModule("reporting") tier gate is preserved inside the
// router. The artifact-download route has NO tier gate inline, so it has
// none here either. Mounted under /api/workspace AFTER the global
// app.use("/api/workspace", requireAuth); the LECTURE DECK routes
// (/api/reports/deck/*, public pre-auth) are a separate deferred family and
// do NOT move here.
// ---------------------------------------------------------------------------

export interface ReportsRouterDeps {
  requireModule: (mod: string) => any;
}

export function createReportsRouter(deps: ReportsRouterDeps): Router {
  const router = Router();
  const { requireModule } = deps;

router.get('/reports', requireModule("reporting"), async (req: Request, res: Response) => {
  const { data, error } = await res.locals.sb.from("saved_reports").select("*").order("created_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true, reports: data });
});

router.post('/reports', requireModule("reporting"), async (req: Request, res: Response) => {
  const { name, blocks, dateRange } = req.body as { name?: string; blocks?: any[]; dateRange?: string };
  if (!name || !name.trim()) {
    res.status(400).json({ error: "Report name is required" });
    return;
  }
  const { data, error } = await res.locals.sb
    .from("saved_reports")
    .insert({ workspace_id: res.locals.wsId, name: name.trim(), blocks: blocks || [], date_range: dateRange || "Last 30 Days" })
    .select()
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true, report: data });
});

router.delete('/reports/:id', requireModule("reporting"), async (req: Request, res: Response) => {
  const { error } = await res.locals.sb.from("saved_reports").delete().eq("id", req.params.id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true });
});

router.post('/reports/snapshot/render', requireModule("reporting"), async (req: Request, res: Response) => {
  try {
    const { snapshot, brand, format } = req.body;
    const validated = validateReportSnapshot(snapshot);
    const wsId = res.locals.wsId || validated.workspaceId;

    if (format === "bundle") {
      const bundle = await generateReportArtifactBundle(validated, brand);
      reportArtifactRepository.storeBundle(bundle);
      res.json({
        success: true,
        bundleHash: bundle.bundleHash,
        snapshotId: bundle.snapshotId,
        artifacts: {
          pdf: {
            artifactHash: bundle.pdf.artifactHash,
            byteSize: bundle.pdf.byteSize,
            downloadUrl: `/api/workspace/reports/artifact/${bundle.pdf.artifactHash}/download`,
            filename: bundle.pdf.filename,
          },
          pptx: {
            artifactHash: bundle.pptx.artifactHash,
            byteSize: bundle.pptx.byteSize,
            downloadUrl: `/api/workspace/reports/artifact/${bundle.pptx.artifactHash}/download`,
            filename: bundle.pptx.filename,
          },
          xlsx: {
            artifactHash: bundle.xlsx.artifactHash,
            byteSize: bundle.xlsx.byteSize,
            downloadUrl: `/api/workspace/reports/artifact/${bundle.xlsx.artifactHash}/download`,
            filename: bundle.xlsx.filename,
          },
        },
      });
      return;
    }

    if (format === "pptx") {
      const pptxResult = await renderSnapshotToPPTX(validated, brand);
      reportArtifactRepository.storeArtifact(pptxResult, wsId, validated.id);
      res.json({
        success: true,
        format: "pptx",
        artifactHash: pptxResult.artifactHash,
        byteSize: pptxResult.byteSize,
        slideCount: pptxResult.metadata?.slideCount || 6,
        downloadUrl: `/api/workspace/reports/artifact/${pptxResult.artifactHash}/download`,
        filename: pptxResult.filename,
      });
      return;
    }

    if (format === "xlsx") {
      const xlsxResult = await renderSnapshotToXLSX(validated);
      reportArtifactRepository.storeArtifact(xlsxResult, wsId, validated.id);
      res.json({
        success: true,
        format: "xlsx",
        artifactHash: xlsxResult.artifactHash,
        byteSize: xlsxResult.byteSize,
        sheetCount: xlsxResult.metadata?.sheetCount || 5,
        downloadUrl: `/api/workspace/reports/artifact/${xlsxResult.artifactHash}/download`,
        filename: xlsxResult.filename,
      });
      return;
    }

    // Default to PDF
    const result = await renderSnapshotToPDF(validated, brand);
    reportArtifactRepository.storeArtifact(result, wsId, validated.id);

    res.json({
      success: true,
      format: "pdf",
      artifactHash: result.artifactHash,
      byteSize: result.byteSize,
      pageCount: result.metadata?.pageCount || 2,
      downloadUrl: `/api/workspace/reports/artifact/${result.artifactHash}/download`,
      filename: result.filename,
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/reports/artifact/:hash/download', async (req: Request, res: Response) => {
  const requestingWorkspaceId = res.locals.wsId || (req.query.workspaceId as string) || "";
  const lookup = reportArtifactRepository.getArtifactForWorkspace(req.params.hash, requestingWorkspaceId);
  if (lookup.status === "not_found") {
    res.status(404).json({ error: lookup.error });
    return;
  }
  if (lookup.status === "forbidden") {
    res.status(403).json({ error: lookup.error });
    return;
  }
  const artifact = lookup.artifact;
  res.setHeader("Content-Type", artifact.mime);
  res.setHeader("Content-Disposition", `attachment; filename="${artifact.filename}"`);
  res.setHeader("Content-Length", artifact.byteSize);
  res.send(artifact.buffer);
});

  return router;
}
