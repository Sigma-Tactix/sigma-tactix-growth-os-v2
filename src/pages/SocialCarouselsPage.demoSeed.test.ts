import { describe, expect, it } from 'vitest';
import {
  INITIAL_LINKEDIN_SLIDES,
  INITIAL_THREAD_TWEETS,
} from '@/src/pages/SocialCarouselsPage';

// Regression lock for the audit finding "demo slides render unconditionally
// despite an unused demo-seed gate": a fresh tenant (no VITE_SEED_DEMO_WORKSPACE
// env) must start with zero slides and zero tweets; the fixtures stay reachable
// only behind the flag, exactly like every other module (PaidAdsPage,
// AttributionRoiPage, ContentEnginePage).
describe('SocialCarouselsPage demo-seed gate', () => {
  it('starts empty for a fresh workspace', () => {
    expect(INITIAL_LINKEDIN_SLIDES).toEqual([]);
    expect(INITIAL_THREAD_TWEETS).toEqual([]);
  });
});
