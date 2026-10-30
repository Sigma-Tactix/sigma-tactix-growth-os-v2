/**
 * Controlled generative UI for chat surfaces (CopilotKit pattern, no dependency):
 * the agent emits pre-built, data-driven UI blocks fenced inside its text.
 * The frontend renders them with sigma primitives; unknown blocks degrade to
 * their textual form so a bad block can never break the message.
 */

export type ChatBlockType =
  | 'steps'
  | 'metrics'
  | 'comparison'
  | 'timeline'
  | 'list'
  | 'callout'
  | 'kv';

export interface ChatBlock {
  type: ChatBlockType;
  /** Falls back to the full JSON (stringified) for unrenderable/unknown shapes */
  fallback: string;
  title?: string;
  items?: Array<string | { label: string; detail?: string; status?: 'ok' | 'warn' | 'bad' | 'idle' }>;
  /** type=metrics only */
  values?: Array<{ label: string; value: string; delta?: string; trend?: 'up' | 'down' | 'flat' }>;
  /** type=comparison only */
  columns?: string[];
  rows?: Array<Array<string | null>>;
  /** type=callout only */
  tone?: 'info' | 'warning' | 'success' | 'danger';
  body?: string;
}

const KNOWN_TYPES = new Set<ChatBlockType>([
  'steps',
  'metrics',
  'comparison',
  'timeline',
  'list',
  'callout',
  'kv',
]);

export function splitChatBlocks(text: string): Array<{ kind: 'text'; text: string } | { kind: 'block'; block: ChatBlock }> {
  const chunks: Array<{ kind: 'text'; text: string } | { kind: 'block'; block: ChatBlock }> = [];
  const lines = text.split('\n');
  let buf: string[] = [];
  const flush = () => {
    const joined = buf.join('\n').trim();
    if (joined) chunks.push({ kind: 'text', text: joined });
    buf = [];
  };
  for (const line of lines) {
    const m = /^\s*:::block\s*(.*)$/.exec(line);
    if (m) {
      flush();
      const block = parseChatBlock(m[1]);
      if (block) chunks.push({ kind: 'block', block });
      else if (m[1].trim()) chunks.push({ kind: 'text', text: m[1].trim() });
    } else {
      buf.push(line);
    }
  }
  flush();
  return chunks;
}

export function parseChatBlock(raw: string): ChatBlock | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const candidate = data as Record<string, unknown>;
  if (typeof candidate.type !== 'string' || !KNOWN_TYPES.has(candidate.type as ChatBlockType)) {
    return null;
  }
  const fallback = JSON.stringify(candidate);
  const type = candidate.type as ChatBlockType;
  const items = Array.isArray(candidate.items)
    ? candidate.items.map((it) => {
        if (typeof it === 'string') return it;
        if (typeof it === 'object' && it !== null) {
          const obj = it as Record<string, unknown>;
          return {
            label: String(obj.label ?? ''),
            detail: obj.detail === undefined ? undefined : String(obj.detail),
            status:
              obj.status === 'ok' || obj.status === 'warn' || obj.status === 'bad' || obj.status === 'idle'
                ? (obj.status as 'ok' | 'warn' | 'bad' | 'idle')
                : 'idle',
          };
        }
        return String(it);
      })
    : undefined;

  return {
    type,
    fallback,
    title: candidate.title === undefined ? undefined : String(candidate.title),
    items,
    values: Array.isArray(candidate.values)
      ? candidate.values
          .filter((v) => typeof v === 'object' && v !== null)
          .map((v) => {
            const obj = v as Record<string, unknown>;
            return {
              label: String(obj.label ?? ''),
              value: String(obj.value ?? ''),
              delta: obj.delta === undefined ? undefined : String(obj.delta),
              trend: obj.trend === 'up' || obj.trend === 'down' ? obj.trend : 'flat',
            };
          })
      : undefined,
    columns: Array.isArray(candidate.columns) ? candidate.columns.map((c) => String(c)) : undefined,
    rows: Array.isArray(candidate.rows)
      ? candidate.rows.map((r) =>
          Array.isArray(r) ? r.map((c) => (c === null ? null : String(c))) : null
        )
      : undefined,
    tone: candidate.tone === 'info' || candidate.tone === 'warning' || candidate.tone === 'success' || candidate.tone === 'danger'
      ? candidate.tone
      : undefined,
    body: candidate.body === undefined ? undefined : String(candidate.body),
  };
}

/** Compact instruction text appended to a system prompt to elicit blocks when useful. */
export const CHAT_BLOCK_INSTRUCTION = [
  'Formatting: you may emit data blocks on their own line as :::block{...single-line JSON...} (no backticks).',
  'Example: :::block{"type":"steps","title":"Set up connectors","items":["Open Settings","Click Connect","Approve"]}',
  'Allowed types: "steps" (ordered items), "metrics" (title+values[{label,value,delta,trend:"up"|"down"}]), "list", "kv" (title+items), "callout" (tone:"info"|"warning"|"success"|"danger",title,body), "timeline" (title+items[{label,detail}]).',
  'Use a block only when it adds scannability (multi-step guides, KPI summaries). Keep block JSON strictly valid, single line, under 600 characters. Never put data outside the block that you also must state in prose.',
].join('\n');
