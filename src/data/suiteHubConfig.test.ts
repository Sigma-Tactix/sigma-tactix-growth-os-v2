import { describe, expect, it } from 'vitest';
import { SUITE_HUBS, SUITE_MODULES, MEASUREMENT_MODULE } from '@/src/data/suiteHubConfig';

describe('concise Digital Marketing Suite config', () => {
  it('groups the 14 working modules into 6 department hubs + 1 measurement module', () => {
    expect(SUITE_MODULES).toHaveLength(14);
    expect(Object.values(SUITE_HUBS)).toHaveLength(6);
  });

  it('keeps every module href an existing Deep-Link route', () => {
    const known = new Set([
      '/content', '/image-studio', '/video-studio',
      '/social-carousels', '/social-listening',
      '/seo-aeo', '/cro-studio',
      '/intake', '/outreach',
      '/paid-ads', '/email-marketing',
      '/competitors', '/market-simulator',
      '/attribution',
    ]);
    for (const mod of SUITE_MODULES) {
      expect(known.has(mod.href), `route for ${mod.label}`).toBe(true);
    }
  });

  it('maps each hub to a named global marketing department', () => {
    for (const hub of Object.values(SUITE_HUBS)) {
      expect(hub.department.length).toBeGreaterThan(0);
      expect(hub.modules.length).toBeGreaterThanOrEqual(2);
    }
    expect(MEASUREMENT_MODULE.href).toBe('/attribution');
  });
});
