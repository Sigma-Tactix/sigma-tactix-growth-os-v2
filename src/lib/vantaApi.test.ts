import { describe, expect, it } from 'vitest';
import { shouldUseVantaWebResearch } from './vantaApi';

describe('VANTA web research routing', () => {
  it('keeps workspace-only questions inside workspace evidence', () => {
    expect(shouldUseVantaWebResearch('Summarize the current Sigma workspace evidence.')).toBe(false);
  });

  it('enables web research only when the request explicitly calls for external research', () => {
    expect(shouldUseVantaWebResearch('Search the web for recent news and include citations.')).toBe(true);
    expect(shouldUseVantaWebResearch('Use online sources for this comparison.')).toBe(true);
  });
});
