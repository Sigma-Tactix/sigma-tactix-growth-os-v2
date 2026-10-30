import { describe, expect, it } from 'vitest';
import { isVantaReleaseEnabled, resolveVantaNavigationTarget } from './vantaFeatureFlag';

describe('VANTA release flag', () => {
  it('fails closed when the flag is absent or ambiguous', () => {
    expect(isVantaReleaseEnabled(undefined)).toBe(false);
    expect(isVantaReleaseEnabled('1')).toBe(false);
    expect(isVantaReleaseEnabled('TRUE')).toBe(false);
    expect(isVantaReleaseEnabled('false')).toBe(false);
  });

  it('enables VANTA only for an explicit true value', () => {
    expect(isVantaReleaseEnabled('true')).toBe(true);
  });

  it('makes the Living System navigable in development without opening the production gate', () => {
    expect(resolveVantaNavigationTarget({ releaseEnabled: false, development: true })).toEqual({
      href: '/living-system?vantaLab=1',
      badge: 'Preview',
    });
    expect(resolveVantaNavigationTarget({ releaseEnabled: false, development: false })).toBeNull();
    expect(resolveVantaNavigationTarget({ releaseEnabled: true, development: false })).toEqual({
      href: '/living-system',
      badge: 'Live',
    });
  });
});
