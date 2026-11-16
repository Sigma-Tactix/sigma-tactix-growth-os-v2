import type { SupabaseClient } from '@supabase/supabase-js';
import { saveDocument, embedText } from './rag.js';

export type BrainEntityType =
  | 'Persona'
  | 'Competitor'
  | 'Hook'
  | 'Objection'
  | 'Offer'
  | 'Channel'
  | 'Metric'
  | 'Playbook'
  | 'Concept';

export type BrainRelationshipType =
  | 'OUTPERFORMS'
  | 'ADDRESSES_OBJECTION'
  | 'TARGETS_PERSONA'
  | 'COUNTER_POSITIONS'
  | 'CITES'
  | 'CONTRADICTS'
  | 'DERIVED_FROM';

export interface BrainEntity {
  id: string;
  workspaceId: string;
  vaultId: string;
  name: string;
  entityType: BrainEntityType;
  summary?: string | null;
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BrainRelationship {
  id: string;
  workspaceId: string;
  sourceId: string;
  targetId: string;
  relationType: BrainRelationshipType;
  weight: number;
  evidenceDocumentId?: string | null;
  createdAt: string;
}

export interface UpsertEntityInput {
  workspaceId: string;
  vaultId: string;
  name: string;
  entityType: BrainEntityType;
  summary?: string | null;
  attributes?: Record<string, any>;
}

export interface LinkEntitiesInput {
  workspaceId: string;
  sourceId: string;
  targetId: string;
  relationType: BrainRelationshipType;
  weight?: number;
  evidenceDocumentId?: string | null;
}

export interface CompoundLearningInput {
  workspaceId: string;
  vaultId: string;
  sourceModule: string;
  learningText: string;
  entityName: string;
  entityType: BrainEntityType;
  attributes?: Record<string, any>;
  relatedEntityName?: string;
  relatedEntityType?: BrainEntityType;
  relationshipType?: BrainRelationshipType;
}

export interface HybridBrainMatch {
  documentId: string;
  fileName: string;
  vaultId: string;
  sourceModule: string;
  contentText: string | null;
  similarity: number;
  sourceEntityName?: string | null;
  relationshipType?: string | null;
  targetEntityName?: string | null;
}

// In-memory fallback stores for test isolation and offline development
const localEntityStore = new Map<string, BrainEntity>();
const localRelationshipStore = new Map<string, BrainRelationship>();

export function clearLocalBrainGraph(): void {
  localEntityStore.clear();
  localRelationshipStore.clear();
}

/**
 * Upserts a knowledge entity in the Second Brain.
 * If an entity with the same name (case-insensitive) and vault exists, it is updated.
 */
export async function upsertBrainEntity(
  sb: SupabaseClient | null,
  input: UpsertEntityInput,
): Promise<BrainEntity> {
  const normalizedName = input.name.trim();
  const attributes = input.attributes || {};

  if (!sb || typeof sb.from !== 'function') {
    const key = `${input.workspaceId}:${input.vaultId}:${normalizedName.toLowerCase()}`;
    const existing = localEntityStore.get(key);
    const now = new Date().toISOString();
    const entity: BrainEntity = {
      id: existing ? existing.id : crypto.randomUUID(),
      workspaceId: input.workspaceId,
      vaultId: input.vaultId,
      name: normalizedName,
      entityType: input.entityType,
      summary: input.summary ?? existing?.summary ?? null,
      attributes: { ...(existing?.attributes || {}), ...attributes },
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    localEntityStore.set(key, entity);
    return entity;
  }

  // Find existing by name + vault in this workspace
  const { data: existingRows } = await sb
    .from('brain_entities')
    .select('*')
    .eq('workspace_id', input.workspaceId)
    .eq('vault_id', input.vaultId)
    .ilike('name', normalizedName)
    .limit(1);

  const existing = existingRows?.[0];
  const now = new Date().toISOString();

  if (existing) {
    const updatedAttrs = { ...(existing.attributes || {}), ...attributes };
    const { data, error } = await sb
      .from('brain_entities')
      .update({
        entity_type: input.entityType,
        summary: input.summary ?? existing.summary,
        attributes: updatedAttrs,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return mapDbEntity(data);
  }

  const { data, error } = await sb
    .from('brain_entities')
    .insert({
      workspace_id: input.workspaceId,
      vault_id: input.vaultId,
      name: normalizedName,
      entity_type: input.entityType,
      summary: input.summary ?? null,
      attributes,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbEntity(data);
}

/**
 * Connects two entities with a typed, weighted relationship edge.
 */
export async function linkBrainEntities(
  sb: SupabaseClient | null,
  input: LinkEntitiesInput,
): Promise<BrainRelationship> {
  const weight = input.weight ?? 1.0;
  const now = new Date().toISOString();

  if (!sb || typeof sb.from !== 'function') {
    const key = `${input.workspaceId}:${input.sourceId}:${input.targetId}:${input.relationType}`;
    const rel: BrainRelationship = {
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      sourceId: input.sourceId,
      targetId: input.targetId,
      relationType: input.relationType,
      weight,
      evidenceDocumentId: input.evidenceDocumentId ?? null,
      createdAt: now,
    };
    localRelationshipStore.set(key, rel);
    return rel;
  }

  const { data, error } = await sb
    .from('brain_relationships')
    .insert({
      workspace_id: input.workspaceId,
      source_id: input.sourceId,
      target_id: input.targetId,
      relation_type: input.relationType,
      weight,
      evidence_document_id: input.evidenceDocumentId ?? null,
      created_at: now,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbRelationship(data);
}

/**
 * Returns the entity and relationship graph for a workspace, optionally filtered by vault IDs.
 */
export async function getBrainGraph(
  sb: SupabaseClient | null,
  workspaceId: string,
  vaultIds?: string[],
): Promise<{ entities: BrainEntity[]; relationships: BrainRelationship[] }> {
  if (!sb || typeof sb.from !== 'function') {
    const entities = Array.from(localEntityStore.values()).filter(
      (e) => e.workspaceId === workspaceId && (!vaultIds || vaultIds.includes(e.vaultId)),
    );
    const entityIds = new Set(entities.map((e) => e.id));
    const relationships = Array.from(localRelationshipStore.values()).filter(
      (r) => r.workspaceId === workspaceId && entityIds.has(r.sourceId) && entityIds.has(r.targetId),
    );
    return { entities, relationships };
  }

  let query = sb.from('brain_entities').select('*').eq('workspace_id', workspaceId);
  if (vaultIds && vaultIds.length > 0) {
    query = query.in('vault_id', vaultIds);
  }

  const { data: entityData, error: entityError } = await query;
  if (entityError) throw entityError;
  const entities = (entityData || []).map(mapDbEntity);

  const entityIds = entities.map((e) => e.id);
  if (entityIds.length === 0) {
    return { entities: [], relationships: [] };
  }

  const { data: relData, error: relError } = await sb
    .from('brain_relationships')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('source_id', entityIds)
    .in('target_id', entityIds);

  if (relError) throw relError;
  const relationships = (relData || []).map(mapDbRelationship);

  return { entities, relationships };
}

/**
 * Compounds an agent finding into the Second Brain:
 * 1. Stores narrative evidence as an embedded document in `documents` (pgvector).
 * 2. Upserts the primary knowledge entity.
 * 3. If related entity info is present, upserts it and creates a relational edge.
 */
export async function compoundAgentLearning(
  sb: SupabaseClient | null,
  input: CompoundLearningInput,
): Promise<{
  primaryEntity: BrainEntity;
  relatedEntity?: BrainEntity;
  relationship?: BrainRelationship;
  documentId?: string;
}> {
  // 1. Save document for vector retrieval
  let documentId: string | undefined;
  if (sb && typeof sb.from === 'function') {
    try {
      documentId = await saveDocument(sb, {
        workspaceId: input.workspaceId,
        vaultId: input.vaultId,
        sourceModule: input.sourceModule,
        fileName: `${input.sourceModule}_learning_${Date.now()}.txt`,
        contentText: input.learningText,
      });
    } catch {
      // Soft-degrade: document embedding failure does not block graph creation
    }
  }

  // 2. Upsert primary entity
  const primaryEntity = await upsertBrainEntity(sb, {
    workspaceId: input.workspaceId,
    vaultId: input.vaultId,
    name: input.entityName,
    entityType: input.entityType,
    summary: input.learningText,
    attributes: {
      ...(input.attributes || {}),
      sourceModule: input.sourceModule,
      lastEvidenceDocId: documentId,
    },
  });

  // 3. Link related entity if specified
  let relatedEntity: BrainEntity | undefined;
  let relationship: BrainRelationship | undefined;

  if (input.relatedEntityName && input.relationshipType) {
    relatedEntity = await upsertBrainEntity(sb, {
      workspaceId: input.workspaceId,
      vaultId: input.vaultId,
      name: input.relatedEntityName,
      entityType: input.relatedEntityType || 'Concept',
    });

    relationship = await linkBrainEntities(sb, {
      workspaceId: input.workspaceId,
      sourceId: primaryEntity.id,
      targetId: relatedEntity.id,
      relationType: input.relationshipType,
      evidenceDocumentId: documentId,
    });
  }

  return { primaryEntity, relatedEntity, relationship, documentId };
}

/**
 * Performs hybrid graph-vector retrieval combining pgvector similarity with graph edges.
 */
export async function searchHybridBrain(
  sb: SupabaseClient | null,
  workspaceId: string,
  query: string,
  opts: { vaultIds?: string[]; topK?: number; apiKey?: string } = {},
): Promise<HybridBrainMatch[]> {
  if (!sb || typeof sb.rpc !== 'function') {
    return [];
  }

  const queryEmbedding = await embedText(query, opts.apiKey);
  if (!queryEmbedding) return [];

  const topK = opts.topK ?? 5;
  const vaultIds = opts.vaultIds || [
    'brand',
    'customer',
    'marketing',
    'authority',
    'operations',
    'audit',
    'technical',
  ];

  const { data, error } = await sb.rpc('match_hybrid_brain_context', {
    p_workspace_id: workspaceId,
    p_vault_ids: vaultIds,
    p_query_embedding: queryEmbedding,
    p_match_count: topK,
  });

  if (error) {
    console.error('match_hybrid_brain_context RPC failed:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    documentId: row.document_id,
    fileName: row.file_name,
    vaultId: row.vault_id,
    sourceModule: row.source_module,
    contentText: row.content_text,
    similarity: row.similarity,
    sourceEntityName: row.source_entity_name,
    relationshipType: row.relationship_type,
    targetEntityName: row.target_entity_name,
  }));
}

function mapDbEntity(row: any): BrainEntity {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    vaultId: row.vault_id,
    name: row.name,
    entityType: row.entity_type,
    summary: row.summary,
    attributes: row.attributes || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbRelationship(row: any): BrainRelationship {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    sourceId: row.source_id,
    targetId: row.target_id,
    relationType: row.relation_type,
    weight: row.weight ?? 1.0,
    evidenceDocumentId: row.evidence_document_id,
    createdAt: row.created_at,
  };
}
