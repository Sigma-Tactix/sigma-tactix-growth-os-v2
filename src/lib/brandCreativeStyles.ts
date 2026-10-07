export interface BrandCreativeStyleContext {
  voiceAndTone?: string;
  corePositioning?: string;
  brandSlogan?: string;
  keyMessages?: string[];
}

export interface BrandCreativeStylePreset {
  id: string;
  label: string;
  desc: string;
  promptGuidance: string;
  source: 'brand_vault' | 'sigma_default';
}

const sigmaVisualSystem = 'Use Sigma Tactix obsidian (#07090d) space, restrained Sigma orange (#ff481b) signal light, fine technical grids, high-contrast typography, and no generic neon or stock-photo treatment.';

function compact(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 500) : fallback;
}

export function buildBrandCreativeStylePresets(brand: BrandCreativeStyleContext = {}): BrandCreativeStylePreset[] {
  const hasBrandVault = Boolean(brand.voiceAndTone?.trim() || brand.corePositioning?.trim() || brand.brandSlogan?.trim() || brand.keyMessages?.some(Boolean));
  const positioning = compact(brand.corePositioning, 'evidence-led, approval-gated growth operations');
  const voice = compact(brand.voiceAndTone, 'authoritative, empirical, technically precise, and free from buzzwords');
  const slogan = compact(brand.brandSlogan, 'Sigma Tactix Growth OS');
  const keyMessage = brand.keyMessages?.find(message => message.trim())?.trim() || positioning;
  const source = hasBrandVault ? 'brand_vault' as const : 'sigma_default' as const;

  return [
    { id: 'SIGMA_SIGNAL_CORE', label: 'Sigma Signal Core', desc: `${slogan} — visual authority without generic AI glow.`, promptGuidance: `${sigmaVisualSystem} Compose a singular orange signal core with controlled depth and precise telemetry. Brand positioning: ${positioning}. Brand voice: ${voice}.`, source },
    { id: 'EVIDENCE_SYSTEM', label: 'Evidence System', desc: 'A restrained executive proof visual based on the Brand Vault.', promptGuidance: `${sigmaVisualSystem} Create a proof-led editorial visual: measured diagrams, verifiable-looking data structures, and deliberate negative space. Anchor the composition to this brand message: ${keyMessage}. Tone: ${voice}.`, source },
    { id: 'EXECUTIVE_EDITORIAL', label: 'Executive Editorial', desc: 'Premium B2B storytelling, designed for decision-makers.', promptGuidance: `${sigmaVisualSystem} Use editorial hierarchy, natural material texture, and an executive decision-making context. Avoid staged boardrooms and stock imagery. Positioning: ${positioning}. Voice: ${voice}.`, source },
    { id: 'MOTION_STORYBOARD', label: 'Motion Storyboard', desc: 'A visual system that can carry a multi-scene short.', promptGuidance: `${sigmaVisualSystem} Design a cinematic keyframe suitable for a three-scene motion sequence: problem signal, operating-system proof, and CTA resolution. Narrative anchor: ${slogan}. Brand message: ${keyMessage}.`, source },
  ];
}
