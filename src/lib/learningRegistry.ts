import { isSecretVaultId, isSecretVaultName } from './secretVaultPolicy';

export type LearningCategory =
  | 'technical_regression'
  | 'positioning'
  | 'conversion_cro'
  | 'channel_operations'
  | 'audience_icp';

export type LearningStatus = 'draft' | 'pending_review' | 'approved' | 'superseded' | 'revoked';

export interface DevelopmentLesson {
  lessonId: string;
  failureContext: string;
  verifiedFix: string;
  regressionTestCase: string;
  version: number;
  resolvedAt: string;
}

export interface ClientLearningEntry {
  id: string;
  workspaceId: string;
  jobRunId: string;
  taskTitle: string;
  category: LearningCategory;
  reviewedOutcome: string;
  limitations: string;
  lessonContent: string;
  targetVault: string;
  status: LearningStatus;
  version: number;
  supersededBy?: string;
  revokedReason?: string;
  author: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Historical development lessons recorded during sprint execution (S21-A1).
 * Reproduces real development failures, their verified fixes, and regression test suites.
 */
export const DEVELOPMENT_LESSON_REGISTRY: DevelopmentLesson[] = [
  {
    lessonId: 'DEV-LRN-001',
    failureContext: "Node.js URL constructor parses 'sc-domain:example.com' with origin 'null', producing corrupted normalized string 'nullexample.com'.",
    verifiedFix: 'Added explicit sc-domain: prefix guard prior to URL parsing in normalizeAccountIdentifier.',
    regressionTestCase: 'src/lib/sourceOperations.test.ts > normalizes Google Search Console identifiers correctly',
    version: 1,
    resolvedAt: '2026-11-18T01:30:00Z',
  },
  {
    lessonId: 'DEV-LRN-002',
    failureContext: "SheetJS XLSX.write drops formula cells structured as { f: 'formula' } without explicit type 'n' and precomputed value 'v'.",
    verifiedFix: "Populated formula cells with { t: 'n', f: formulaString, v: computedValue } and parsed with cellFormula: true.",
    regressionTestCase: 'src/lib/reportArtifactPipeline.test.ts > generates Excel workbook with authentic formulas, numbers, and multiple structured sheets',
    version: 1,
    resolvedAt: '2026-11-18T01:50:00Z',
  },
  {
    lessonId: 'DEV-LRN-003',
    failureContext: 'Max-step execution budget exhaustion emitted mission completed without checking for final verified artifact receipt.',
    verifiedFix: 'Tagged step exhaustion as execution_incomplete with distinct error code, preventing false success completion.',
    regressionTestCase: 'src/lib/vantaToolGateway.test.ts > halts execution and returns step_exhaustion when step limit exceeded',
    version: 1,
    resolvedAt: '2026-11-18T00:45:00Z',
  },
];

/**
 * Strict immutable guard preventing self-modification of policies, privilege elevation,
 * or modification of Secret Vault exclusions via learned context (S21-A3).
 */
export function assertPolicyImmutable(content: string): void {
  const prohibitedPatterns = [
    /allow[-_\s]?all[-_\s]?vaults/i,
    /bypass[-_\s]?approval/i,
    /grant[-_\s]?admin/i,
    /override[-_\s]?secret[-_\s]?vault/i,
    /disable[-_\s]?rate[-_\s]?limit/i,
    /elevate[-_\s]?privilege/i,
    /executive[-_\s]?vault/i,
    /credentials[-_\s]?vault/i,
  ];

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(content)) {
      throw new Error(
        'POLICY_VIOLATION: Learned knowledge cannot modify agent privilege tiers, approval policies, or Secret Vault exclusions.'
      );
    }
  }
}

/**
 * Learning Registry Repository enforcing Client Enclave boundaries and versioning.
 */
export class LearningRegistryRepository {
  private learnings = new Map<string, ClientLearningEntry>();

  /**
   * Records a reviewed client job outcome and stores an approved or pending Knowledge Vault lesson (S21-A2).
   */
  public recordClientLearning(params: {
    workspaceId: string;
    jobRunId: string;
    taskTitle: string;
    category: LearningCategory;
    reviewedOutcome: string;
    limitations: string;
    lessonContent: string;
    targetVault: string;
    author: string;
    status?: LearningStatus;
  }): ClientLearningEntry {
    if (!params.workspaceId) {
      throw new Error('Workspace ID is required.');
    }

    // Zero-trust Secret Vault protection: targetVault must never be a Secret Vault
    if (isSecretVaultName(params.targetVault) || isSecretVaultId(params.targetVault)) {
      throw new Error(`FORBIDDEN_VAULT: Lessons cannot be targeted to Secret Vault "${params.targetVault}".`);
    }

    // Verify content cannot self-modify security boundaries
    assertPolicyImmutable(params.lessonContent);

    const now = new Date().toISOString();
    const entry: ClientLearningEntry = {
      id: `learn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      workspaceId: params.workspaceId,
      jobRunId: params.jobRunId,
      taskTitle: params.taskTitle,
      category: params.category,
      reviewedOutcome: params.reviewedOutcome,
      limitations: params.limitations,
      lessonContent: params.lessonContent,
      targetVault: params.targetVault,
      status: params.status || 'pending_review',
      version: 1,
      author: params.author,
      createdAt: now,
      updatedAt: now,
    };

    this.learnings.set(entry.id, entry);
    return entry;
  }

  /**
   * Approves a pending lesson after operator review.
   */
  public approveLearning(learningId: string, reviewer: string): ClientLearningEntry {
    const entry = this.learnings.get(learningId);
    if (!entry) throw new Error('Learning entry not found.');

    entry.status = 'approved';
    entry.reviewedBy = reviewer;
    entry.updatedAt = new Date().toISOString();
    return entry;
  }

  /**
   * Supersedes an outdated or corrected lesson with a newer version (S21-A3).
   */
  public supersedeLearning(
    oldLearningId: string,
    newParams: {
      category?: LearningCategory;
      reviewedOutcome?: string;
      limitations?: string;
      lessonContent: string;
      targetVault?: string;
    },
    reviewer: string
  ): ClientLearningEntry {
    const oldEntry = this.learnings.get(oldLearningId);
    if (!oldEntry) throw new Error('Existing learning entry not found.');

    assertPolicyImmutable(newParams.lessonContent);

    const now = new Date().toISOString();
    const newVersion = oldEntry.version + 1;
    const newEntry: ClientLearningEntry = {
      id: `learn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      workspaceId: oldEntry.workspaceId,
      jobRunId: oldEntry.jobRunId,
      taskTitle: oldEntry.taskTitle,
      category: newParams.category || oldEntry.category,
      reviewedOutcome: newParams.reviewedOutcome || oldEntry.reviewedOutcome,
      limitations: newParams.limitations || oldEntry.limitations,
      lessonContent: newParams.lessonContent,
      targetVault: newParams.targetVault || oldEntry.targetVault,
      status: 'approved',
      version: newVersion,
      author: reviewer,
      reviewedBy: reviewer,
      createdAt: now,
      updatedAt: now,
    };

    // Mark old entry as superseded
    oldEntry.status = 'superseded';
    oldEntry.supersededBy = newEntry.id;
    oldEntry.updatedAt = now;

    this.learnings.set(newEntry.id, newEntry);
    return newEntry;
  }

  /**
   * Revokes an incorrect or invalid lesson. Revoked lessons are immediately excluded from agent queries (S21-A3).
   */
  public revokeLearning(learningId: string, reviewer: string, reason: string): ClientLearningEntry {
    const entry = this.learnings.get(learningId);
    if (!entry) throw new Error('Learning entry not found.');

    entry.status = 'revoked';
    entry.revokedReason = reason;
    entry.reviewedBy = reviewer;
    entry.updatedAt = new Date().toISOString();
    return entry;
  }

  /**
   * Queries active, approved lessons scoped strictly to the requesting workspace and permitted vaults (S21-A3).
   * Superseded, revoked, or foreign-tenant lessons are excluded.
   */
  public queryScopedLearnings(
    workspaceId: string,
    options: {
      category?: LearningCategory;
      vaultScope?: string[];
      query?: string;
    } = {}
  ): ClientLearningEntry[] {
    const results: ClientLearningEntry[] = [];

    for (const entry of this.learnings.values()) {
      // 1. Strict workspace enclave isolation
      if (entry.workspaceId !== workspaceId) continue;

      // 2. Only active approved lessons (exclude draft, pending, superseded, revoked)
      if (entry.status !== 'approved') continue;

      // 3. Vault scope filter
      if (options.vaultScope && options.vaultScope.length > 0) {
        if (!options.vaultScope.includes(entry.targetVault)) continue;
      }

      // 4. Category filter
      if (options.category && entry.category !== options.category) continue;

      // 5. Query substring match
      if (options.query) {
        const q = options.query.toLowerCase();
        const matches =
          entry.taskTitle.toLowerCase().includes(q) ||
          entry.lessonContent.toLowerCase().includes(q) ||
          entry.reviewedOutcome.toLowerCase().includes(q);
        if (!matches) continue;
      }

      results.push(entry);
    }

    return results;
  }

  public getById(learningId: string): ClientLearningEntry | undefined {
    return this.learnings.get(learningId);
  }

  public count(): number {
    return this.learnings.size;
  }

  public clear(): void {
    this.learnings.clear();
  }
}

export const globalLearningRegistry = new LearningRegistryRepository();
