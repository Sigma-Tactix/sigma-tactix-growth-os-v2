import { Router, type Request, type Response } from 'express';
import { globalLearningRegistry, DEVELOPMENT_LESSON_REGISTRY } from '../../lib/learningRegistry.js';

// ---------------------------------------------------------------------------
// Learning Registry (Phase 3 & Task S21 Learning Loops) — versioned
// development lessons, client job learnings, and scoped retrieval.
//
// Extracted from server.ts (P2 increment 22 of the router-extraction
// program, see docs/OPTIMIZATION_AUDIT.md). Handler bodies byte-preserved.
// Nothing here touches the Supabase client (no getDB/saveDB) and none of the
// routes carried a tier gate inline, so the factory is zero-arg and the
// entire dependency surface is the learningRegistry lib module, which imports
// directly. Mounted at the root (full /api/workspace/learnings... paths) at
// the ORIGINAL position — strictly after
// app.use("/api/workspace", requireAuth) — so the auth + RLS posture is
// unchanged.
// ---------------------------------------------------------------------------

export function createLearningRegistryRouter(): Router {
  const router = Router();

router.get('/api/workspace/learnings', async (req: Request, res: Response) => {
  const wsId = res.locals.wsId;
  const category = req.query.category as any;
  const query = req.query.q as string;
  const vaultScope = req.query.vaultScope ? (req.query.vaultScope as string).split(",") : undefined;
  const learnings = globalLearningRegistry.queryScopedLearnings(wsId, { category, query, vaultScope });
  res.json({ success: true, learnings });
});

router.post('/api/workspace/learnings', async (req: Request, res: Response) => {
  try {
    const wsId = res.locals.wsId;
    const { jobRunId, taskTitle, category, reviewedOutcome, limitations, lessonContent, targetVault, author } = req.body;
    const entry = globalLearningRegistry.recordClientLearning({
      workspaceId: wsId,
      jobRunId: jobRunId || `manual-${Date.now()}`,
      taskTitle: taskTitle || "Operator Learning",
      category: category || "positioning",
      reviewedOutcome: reviewedOutcome || "",
      limitations: limitations || "",
      lessonContent: lessonContent || "",
      targetVault: targetVault || "Brand Vault",
      author: author || res.locals.userEmail || "Operator",
    });
    res.json({ success: true, learning: entry });
  } catch (err: any) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

router.post('/api/workspace/learnings/:id/approve', async (req: Request, res: Response) => {
  try {
    const reviewer = res.locals.userEmail || req.body.reviewer || "Lead Reviewer";
    const entry = globalLearningRegistry.approveLearning(req.params.id, reviewer);
    res.json({ success: true, learning: entry });
  } catch (err: any) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

router.post('/api/workspace/learnings/:id/supersede', async (req: Request, res: Response) => {
  try {
    const reviewer = res.locals.userEmail || req.body.reviewer || "Lead Reviewer";
    const entry = globalLearningRegistry.supersedeLearning(req.params.id, req.body, reviewer);
    res.json({ success: true, learning: entry });
  } catch (err: any) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

router.post('/api/workspace/learnings/:id/revoke', async (req: Request, res: Response) => {
  try {
    const reviewer = res.locals.userEmail || req.body.reviewer || "Lead Reviewer";
    const reason = req.body.reason || "Superseded or invalidated by operator";
    const entry = globalLearningRegistry.revokeLearning(req.params.id, reviewer, reason);
    res.json({ success: true, learning: entry });
  } catch (err: any) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

router.get('/api/workspace/learnings/development', async (_req: Request, res: Response) => {
  res.json({ success: true, lessons: DEVELOPMENT_LESSON_REGISTRY });
});

  return router;
}
