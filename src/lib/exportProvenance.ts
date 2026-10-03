/**
 * Phase 3 groundwork: what a client is allowed to be told about an exported row.
 *
 * The audit remediation stopped the *screen* from printing unsupported numbers.
 * This closes the same hole for *files*. Every table export used to ship with no
 * statement of where its rows came from, so a hardcoded fixture and a real GA4
 * pull left the machine as the same anonymous CSV.
 *
 * Centralised so a template can change presentation without ever changing the
 * facts, and so "sample" can never be silently upgraded to "measured".
 */
import { AI_DISCLOSURE_LINE } from './claimLabels.js';

/**
 * `measured`  - read from a connected provider during this reporting period.
 * `sample`    - an illustrative placeholder. NOT this workspace's results.
 * `unknown`   - we genuinely do not know. Treated as unverified.
 */
export type RowProvenance = 'measured' | 'sample' | 'unknown';

/** Column name used in every delivered table. */
export const PROVENANCE_COLUMN: string = 'Data provenance';

/** Column holding the AI notice, so it survives being opened in a spreadsheet. */
export const DISCLOSURE_COLUMN: string = 'AI disclosure';

const PROVENANCE_NOTES: Record<RowProvenance, string> = {
  measured: 'Measured from a connected data source.',
  sample: 'SAMPLE DATA - illustrative placeholder, not this workspace results.',
  unknown: 'Provenance unknown - treat as unverified.',
};

export function provenanceNote(provenance: RowProvenance): string {
  return PROVENANCE_NOTES[provenance] || PROVENANCE_NOTES.unknown;
}

export type DeliveredRow = Record<string, unknown>;

export interface DeliveryMetadata {
  provenance: RowProvenance;
  /** Period the rows describe, in the workspace's own words. */
  periodLabel?: string;
  /** Free-form note rendered as the final row. Defaults to the disclosure. */
  note?: string;
}

/**
 * Tags every row with its provenance and the AI disclosure, and appends a
 * trailing metadata row so a file that is forwarded on its own stays honest.
 */
export function tagRowsForDelivery(rows: DeliveredRow[], meta: DeliveryMetadata): DeliveredRow[] {
  const provenance = provenanceNote(meta.provenance);
  const tagged = (rows || []).map(row => ({
    ...row,
    [PROVENANCE_COLUMN]: provenance,
    [DISCLOSURE_COLUMN]: AI_DISCLOSURE_LINE,
  }));

  const footer: DeliveredRow = {
    [PROVENANCE_COLUMN]: provenance,
    [DISCLOSURE_COLUMN]: AI_DISCLOSURE_LINE,
    Note: meta.note || AI_DISCLOSURE_LINE,
  };
  if (meta.periodLabel) footer['Reporting period'] = meta.periodLabel;
  tagged.push(footer);
  return tagged;
}

/**
 * True when a dataset is safe to describe as this workspace's own results.
 * Callers use it to refuse confident success copy rather than to hide data:
 * sample data is still exportable, it is simply never called measured.
 */
export function isPresentableAsOwnResults(provenance: RowProvenance): boolean {
  return provenance === 'measured';
}