import { describe, expect, it } from 'vitest';
import { inspectArtifactBytes } from './artifactInspection';

describe('artifact inspection contract', () => {
  it('accepts a complete JPEG preview and rejects an incomplete or disguised image', () => {
    expect(inspectArtifactBytes({
      kind: 'jpeg-preview',
      bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]),
    })).toEqual({ valid: true, reasons: [] });

    expect(inspectArtifactBytes({
      kind: 'jpeg-preview',
      bytes: Buffer.from('<!doctype html><p>not an image</p>'),
    })).toEqual({ valid: false, reasons: ['Expected a complete JPEG preview.'] });
  });

  it('accepts a static editable landing page and blocks executable HTML', () => {
    expect(inspectArtifactBytes({
      kind: 'landing-html',
      bytes: Buffer.from('<!doctype html><html><head><title>Draft</title></head><body><a href="#next">Next</a></body></html>'),
    })).toEqual({ valid: true, reasons: [] });

    expect(inspectArtifactBytes({
      kind: 'landing-html',
      bytes: Buffer.from('<!doctype html><html><body><script>alert(1)</script></body></html>'),
    })).toEqual({ valid: false, reasons: ['Editable landing-page HTML must not contain executable script content.'] });
  });
});
