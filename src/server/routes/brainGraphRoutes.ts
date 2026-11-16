import { Router, type Request, type Response } from 'express';
import {
  getBrainGraph,
  upsertBrainEntity,
  linkBrainEntities,
  compoundAgentLearning,
  searchHybridBrain,
  type BrainEntityType,
  type BrainRelationshipType,
} from '../../lib/brainGraph.js';

export function createBrainGraphRouter(): Router {
  const router = Router();

  // Authentication & workspace scope check
  router.use((_req: Request, res: Response, next) => {
    if (!res.locals.wsId) {
      res.status(401).json({ error: 'Workspace context required.' });
      return;
    }
    next();
  });

  // GET /api/workspace/brain/graph
  router.get('/graph', async (req: Request, res: Response) => {
    try {
      const vaultIds = req.query.vaults
        ? (req.query.vaults as string).split(',').map((v) => v.trim()).filter(Boolean)
        : undefined;
      const graph = await getBrainGraph(res.locals.sb, res.locals.wsId, vaultIds);
      res.json({ success: true, ...graph });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve brain graph.' });
    }
  });

  // POST /api/workspace/brain/entities
  router.post('/entities', async (req: Request, res: Response) => {
    const { vaultId, name, entityType, summary, attributes } = req.body;
    if (!vaultId || !name || !entityType) {
      res.status(400).json({ error: 'Missing vaultId, name, or entityType.' });
      return;
    }
    try {
      const entity = await upsertBrainEntity(res.locals.sb, {
        workspaceId: res.locals.wsId,
        vaultId,
        name,
        entityType: entityType as BrainEntityType,
        summary,
        attributes,
      });
      res.json({ success: true, entity });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to upsert brain entity.' });
    }
  });

  // POST /api/workspace/brain/relationships
  router.post('/relationships', async (req: Request, res: Response) => {
    const { sourceId, targetId, relationType, weight, evidenceDocumentId } = req.body;
    if (!sourceId || !targetId || !relationType) {
      res.status(400).json({ error: 'Missing sourceId, targetId, or relationType.' });
      return;
    }
    try {
      const relationship = await linkBrainEntities(res.locals.sb, {
        workspaceId: res.locals.wsId,
        sourceId,
        targetId,
        relationType: relationType as BrainRelationshipType,
        weight,
        evidenceDocumentId,
      });
      res.json({ success: true, relationship });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to link brain entities.' });
    }
  });

  // POST /api/workspace/brain/compound
  router.post('/compound', async (req: Request, res: Response) => {
    const {
      vaultId,
      sourceModule,
      learningText,
      entityName,
      entityType,
      attributes,
      relatedEntityName,
      relatedEntityType,
      relationshipType,
    } = req.body;

    if (!vaultId || !sourceModule || !learningText || !entityName || !entityType) {
      res.status(400).json({
        error: 'Missing required parameters (vaultId, sourceModule, learningText, entityName, entityType).',
      });
      return;
    }

    try {
      const result = await compoundAgentLearning(res.locals.sb, {
        workspaceId: res.locals.wsId,
        vaultId,
        sourceModule,
        learningText,
        entityName,
        entityType: entityType as BrainEntityType,
        attributes,
        relatedEntityName,
        relatedEntityType: relatedEntityType as BrainEntityType | undefined,
        relationshipType: relationshipType as BrainRelationshipType | undefined,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to compound agent learning.' });
    }
  });

  // POST /api/workspace/brain/search
  router.post('/search', async (req: Request, res: Response) => {
    const { query, vaultIds, topK } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query parameter is required.' });
      return;
    }
    try {
      const matches = await searchHybridBrain(res.locals.sb, res.locals.wsId, query, { vaultIds, topK });
      res.json({ success: true, matches });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Hybrid brain search failed.' });
    }
  });

  return router;
}
