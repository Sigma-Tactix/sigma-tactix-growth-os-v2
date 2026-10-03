import { describe, it, expect } from 'vitest';
import {
  tagRowsForDelivery,
  provenanceNote,
  isPresentableAsOwnResults,
  PROVENANCE_COLUMN,
  DISCLOSURE_COLUMN,
  type RowProvenance,
} from './exportProvenance';
import { AI_DISCLOSURE_LINE } from './claimLabels';

const fixtureRows = [{ channel: 'Google Ads', revenue: 114000, roas: 6.2 }];

describe('export provenance contract', () => {
  it('stamps provenance and disclosure on every delivered row', () => {
    const out = tagRowsForDelivery(fixtureRows, { provenance: 'sample' });
    expect(out).toHaveLength(2); // row + footer
    expect(out[0][PROVENANCE_COLUMN]).toMatch(/SAMPLE DATA/i);
    expect(out[0][DISCLOSURE_COLUMN]).toBe(AI_DISCLOSURE_LINE);
  });

  it('never lets sample data read as measured', () => {
    const out = tagRowsForDelivery(fixtureRows, { provenance: 'sample' });
    for (const row of out) {
      expect(String(row[PROVENANCE_COLUMN])).not.toMatch(/^measured/i);
    }
  });

  it('treats unknown as unverified rather than measured', () => {
    expect(provenanceNote('unknown')).toMatch(/unverified/i);
    expect(isPresentableAsOwnResults('unknown')).toBe(false);
    expect(isPresentableAsOwnResults('sample')).toBe(false);
    expect(isPresentableAsOwnResults('measured')).toBe(true);
  });

  it('survives an empty dataset instead of throwing', () => {
    const out = tagRowsForDelivery([], { provenance: 'measured' });
    expect(out).toHaveLength(1); // footer only
    expect(out[0][DISCLOSURE_COLUMN]).toBe(AI_DISCLOSURE_LINE);
  });

  it('carries the reporting period onto the footer row', () => {
    const out = tagRowsForDelivery(fixtureRows, { provenance: 'sample', periodLabel: 'Last 30 days' });
    expect(out[out.length - 1]['Reporting period']).toBe('Last 30 days');
  });

  it('does not mutate the caller rows', () => {
    const rows = [{ a: 1 }];
    tagRowsForDelivery(rows, { provenance: 'measured' });
    expect(rows[0]).toEqual({ a: 1 });
  });

  it('has a note for every provenance value', () => {
    (['measured', 'sample', 'unknown'] as RowProvenance[]).forEach(p => {
      expect(provenanceNote(p).length).toBeGreaterThan(10);
    });
  });
});