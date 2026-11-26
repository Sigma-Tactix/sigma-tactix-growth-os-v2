import { Router, type Request, type Response } from 'express';
import {
  globalLearningRegistry,
  DEVELOPMENT_LESSON_REGISTRY,
} from '../../lib/learningRegistry.js';

// ---------------------------------------------------------------------------
// Workspace learnings — record, review (approve/supersede/revoke) and list
// client-side operator learnings, plus the static development-lesson set.
//
// Extracted from server.ts (P2 increment 3 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). The two registry deps are direct module
// imports (globalLearningRegistry is a module-level singleton; the
// development-lesson list is a module export), so the router needs NO
// injected dependencies — the same "no-dep" shape as createBrainGraphRouter
// / createWorkspaceManageRouter.
//
// Mounted under /api/workspace/learnings AFTER the global
// app.use("/api/workspace", requireAuth) in server.ts, so every route runs
// through the per-request RLS-scoped client exactly as the original inline
// handlers did.
// ---------------------------------------------------------------------------

export function createLearningsRouter(): Router {
  const router = Router();

  // GET / — list + search the caller's scoped learnings.
  router.get('/', async (req: Request, res: Response) => {
    const wsId = res.locals.wsId;
    const category = req.query.category as any;
    const query = req.query.q as string;
    const vaultScope = req.query.vaultScope ? (req.query.vaultScope as string).split(',') : undefined;
    const learnings = globalLearningRegistry.queryScopedLearnings(wsId, { category, query, vaultScope });
    res.json({ success: true, learnings });
  });

  // POST / — record a new client learning.
  router.post('/', async (req: Request, res: Response) => {
    try {
      const wsId = res.locals.wsId;
      const { jobRunId, taskTitle, category, reviewedOutcome, limitations, lessonContent, targetVault, author } = req.body;
      const entry = globalLearningRegistry.recordClientLearning({
        workspaceId: wsId,
        jobRunId: jobRunId || `manual-${Date.now()}`,
        taskTitle: taskTitle || 'Operator Learning',
        category: category || 'positioning',
        reviewedOutcome: reviewedOutcome || '',
        limitations: limitations || '',
        lessonContent: lessonContent || '',
        targetVault: targetVault || 'Brand Vault',
        author: author || res.locals.userEmail || 'Operator',
      });
      res.json({ success: true, learning: entry });
    } catch (err: any) {
      res.status(400).json({ error: err.message || String(err) });
    }
  });

  // Static segment registered BEFORE the /:id/* param routes so
  // GET /learnings/development always wins over any param match.
  router.get('/development', async (_req: Request, res: Response) => {
    res.json({ success: true, lessons: DEVELOPMENT_LESSON_REGISTRY });
  });

  // POST /:id/approve
  router.post('/:id/approve', async (req: Request, res: Response) => {
    try {
      const reviewer = res.locals.userEmail || req.body.reviewer || 'Lead Reviewer';
      const entry = globalLearningRegistry.approveLearning(req.params.id, reviewer);
      res.json({ success: true, learning: entry });
    } catch (err: any) {
      res.status(400).json({ error: err.message || String(err) });
    }
  });

  // POST /:id/supersede
  router.post('/:id/supersede', async (req: Request, res: Response) => {
    try {
      const reviewer = res.locals.userEmail || req.body.reviewer || 'Lead Reviewer';
      const entry = globalLearningRegistry.supersedeLearning(req.params.id, req.body, reviewer);
      res.json({ success: true, learning: entry });
    } catch (err: any) {
      res.status(400).json({ error: err.message || String(err) });
    }
  });

  // POST /:id/revoke
  router.post('/:id/revoke', async (req: Request, res: Response) => {
    try {
      const reviewer = res.locals.userEmail || req.body.reviewer || 'Lead Reviewer';
      const reason = req.body.reason || 'Superseded or invalidated by operator';
      const entry = globalLearningRegistry.revokeLearning(req.params.id, reviewer, reason);
      res.json({ success: true, learning: entry });
    } catch (err: any) {
      res.status(400).json({ error: err.message || String(err) });
    }
  });

  return router;
}
