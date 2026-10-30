export type ArtifactInspectionKind = 'jpeg-preview' | 'landing-html';

export type ArtifactInspectionResult = {
  valid: boolean;
  reasons: string[];
};

function isCompleteJpeg(bytes: Buffer): boolean {
  return bytes.length >= 4
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[2] === 0xff
    && bytes[bytes.length - 2] === 0xff
    && bytes[bytes.length - 1] === 0xd9;
}

function hasExecutableHtmlContent(html: string): boolean {
  return /<script\b|\son\w+\s*=|javascript\s*:/i.test(html);
}

/**
 * Validates only the file traits this artifact contract requires. It is not a
 * general malware scanner; callers still retain origin, hash, and access
 * controls separately.
 */
export function inspectArtifactBytes(input: {
  kind: ArtifactInspectionKind;
  bytes: Buffer;
}): ArtifactInspectionResult {
  if (input.kind === 'jpeg-preview') {
    return isCompleteJpeg(input.bytes)
      ? { valid: true, reasons: [] }
      : { valid: false, reasons: ['Expected a complete JPEG preview.'] };
  }

  const html = input.bytes.toString('utf8');
  if (!/^\s*<!doctype\s+html\b/i.test(html)) {
    return { valid: false, reasons: ['Editable landing-page artifact must be an HTML document.'] };
  }
  if (hasExecutableHtmlContent(html)) {
    return { valid: false, reasons: ['Editable landing-page HTML must not contain executable script content.'] };
  }
  return { valid: true, reasons: [] };
}
