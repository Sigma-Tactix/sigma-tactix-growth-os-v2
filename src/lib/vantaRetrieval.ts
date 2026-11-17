import type { DocumentMatch } from './rag';
import { isSecretVaultId } from './secretVaultPolicy.js';

/** Bound optional context work so it cannot hold the entire conversation open. */
export async function withinBudget<T>(work: PromiseLike<T>, milliseconds: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([Promise.resolve(work).catch(() => fallback), new Promise<T>(resolve => {
      timer = setTimeout(() => resolve(fallback), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}

export function rankStoredDocuments(rows: Array<{ id: string; file_name: string; vault_id: string; source_module: string; content_text: string | null }>, query: string): DocumentMatch[] {
  const terms = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])];
  return rows
    .filter(row => !isSecretVaultId(row.vault_id))
    .map(row => {
      const title = row.file_name.toLowerCase();
      const text = (row.content_text || '').toLowerCase();
      const score = terms.reduce((total, term) => total + (title.includes(term) ? 3 : 0) + (text.includes(term) ? 1 : 0), 0);
      return { row, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ row }) => ({
      id: row.id,
      fileName: row.file_name,
      vaultId: row.vault_id,
      sourceModule: row.source_module,
      contentText: row.content_text,
      similarity: 0,
    }));
}

/** Exact text/filename hits precede semantic neighbors, including unindexed files. Strictly excludes Secret Vaults. */
export function mergeVantaDocumentMatches(semantic: DocumentMatch[], keyword: DocumentMatch[]): DocumentMatch[] {
  return [...new Map([...keyword, ...semantic].map(match => [match.id, match])).values()]
    .filter(match => !isSecretVaultId(match.vaultId))
    .slice(0, 5);
}
