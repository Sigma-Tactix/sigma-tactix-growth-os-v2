import { describe, expect, it } from 'vitest';
import { parseLayaDecisionArgs } from './layaDecide';

describe('Antigravity Laya decision command', () => {
  it('parses a bounded choice without accepting free-form actions', () => {
    expect(parseLayaDecisionArgs([
      '--question', 'Which implementation path should we take?',
      '--context', 'Preserve the existing tenant contract.',
      '--option', 'repair=Repair the shared adapter',
      '--option', 'rebuild=Build a separate stack',
    ])).toEqual({
      question: 'Which implementation path should we take?',
      context: 'Preserve the existing tenant contract.',
      options: [
        { id: 'repair', description: 'Repair the shared adapter' },
        { id: 'rebuild', description: 'Build a separate stack' },
      ],
    });
  });

  it('rejects malformed options', () => {
    expect(() => parseLayaDecisionArgs([
      '--question', 'Choose.',
      '--option', 'missing-description',
    ])).toThrow(/id=description/);
  });
});
