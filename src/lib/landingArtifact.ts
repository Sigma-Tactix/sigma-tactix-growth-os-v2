import { computeArtifactSha256 } from './evidenceContract';

export interface LandingArtifactSource {
  url: string;
  title: string;
  metaDescription: string;
  h1s: string[];
  h2s: string[];
  fetchedAt: string;
}

export interface LandingArtifactBrief {
  objective: string;
  audience: string;
  primaryCta: string;
}

export interface LandingArtifactSection {
  id: 'hero' | 'proof' | 'workflow' | 'cta';
  label: string;
  purpose: string;
}

export interface LandingPageDraft {
  id: string;
  workspaceId: string;
  status: 'draft';
  sourceUrl: string;
  sourceCapturedAt: string;
  sourceHash: string;
  html: string;
  htmlHash: string;
  sections: LandingArtifactSection[];
}

export interface LandingArtifactPreviews {
  sourceDesktop: string | null;
  sourceMobile: string | null;
  proposedDesktop: string | null;
  proposedMobile: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanText(value: string, fallback: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

/**
 * The first proposed-page adapter is deliberately deterministic. A model may
 * later propose copy through a separate reviewed seam, but this module never
 * invents measured conversion results or imports untrusted HTML into a client
 * artifact.
 */
export function buildLandingPageDraft(input: {
  artifactId: string;
  workspaceId: string;
  source: LandingArtifactSource;
  brief: LandingArtifactBrief;
}): LandingPageDraft {
  const sourceTitle = cleanText(input.source.title, 'Your product');
  const sourceDescription = cleanText(input.source.metaDescription, 'A clearer buyer journey starts with one outcome.');
  const h1 = cleanText(input.source.h1s[0] || '', sourceTitle);
  const supportingTheme = cleanText(input.source.h2s[0] || '', input.brief.objective);
  const secondaryTheme = cleanText(input.source.h2s[1] || '', 'Review the next step with your team.');
  const objective = cleanText(input.brief.objective, 'Clarify the buyer journey.');
  const audience = cleanText(input.brief.audience, 'Your evaluation team');
  const cta = cleanText(input.brief.primaryCta, 'Request a working session');
  const sourceHash = computeArtifactSha256(JSON.stringify({
    url: input.source.url,
    title: sourceTitle,
    metaDescription: sourceDescription,
    h1s: input.source.h1s,
    h2s: input.source.h2s,
    fetchedAt: input.source.fetchedAt,
  }));

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(sourceTitle)} — proposed landing page</title>
  <style>
    :root { color-scheme: dark; --ink:#070b16; --panel:#101829; --line:#25324b; --text:#eff5ff; --muted:#aab8d1; --brand:#ff5a36; --mint:#74e0be; }
    * { box-sizing:border-box; } body { margin:0; color:var(--text); background:radial-gradient(circle at 80% 0%,#1a2947 0,var(--ink) 47%); font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    main { width:min(1120px,calc(100% - 40px)); margin:auto; } .eyebrow { color:var(--mint); font:700 12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.14em; text-transform:uppercase; }
    .notice { margin:24px 0 44px; padding:12px 15px; border:1px solid #7f4a3e; border-radius:10px; color:#ffd4ca; background:#2a1720; font-size:13px; }
    .hero { min-height:520px; display:grid; grid-template-columns:1.2fr .8fr; align-items:center; gap:48px; } h1 { margin:14px 0 20px; font-size:clamp(42px,6vw,76px); line-height:.98; letter-spacing:-.06em; max-width:760px; } p { color:var(--muted); font-size:18px; line-height:1.6; max-width:650px; }
    .cta { display:inline-flex; margin-top:20px; padding:14px 19px; color:#170704; background:var(--brand); border-radius:9px; font-weight:800; text-decoration:none; } .card { padding:28px; border:1px solid var(--line); border-radius:18px; background:linear-gradient(145deg,#16223a,#0d1423); box-shadow:0 20px 70px #0005; }
    .metric { display:grid; grid-template-columns:40px 1fr; gap:14px; align-items:start; margin:18px 0; } .number { color:var(--mint); font:bold 18px/1 ui-monospace,monospace; } section { padding:72px 0; border-top:1px solid var(--line); } h2 { font-size:clamp(28px,4vw,48px); letter-spacing:-.045em; margin:10px 0 18px; } .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; } .tile { padding:22px; border:1px solid var(--line); border-radius:12px; background:#0c1321; } .tile h3 { margin:8px 0; font-size:17px; } .tile p { margin:0; font-size:14px; } footer { padding:30px 0 56px; color:#7f90ac; font-size:12px; }
    @media (max-width:760px) { main { width:min(100% - 28px,1120px); } .hero { grid-template-columns:1fr; padding:20px 0 64px; gap:22px; } .grid { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <main>
    <div class="notice">Proposal — not published. Created from public-page evidence captured ${escapeHtml(input.source.fetchedAt)}. Review all product and performance claims before use.</div>
    <section class="hero" id="hero">
      <div>
        <div class="eyebrow">Proposed buyer journey · ${escapeHtml(audience)}</div>
        <h1>${escapeHtml(h1)}</h1>
        <p>${escapeHtml(sourceDescription)}</p>
        <a class="cta" href="#next-step">${escapeHtml(cta)} →</a>
      </div>
      <aside class="card" aria-label="Evaluation path">
        <div class="eyebrow">Designed for evaluation</div>
        <div class="metric"><div class="number">01</div><div><strong>Start with the decision</strong><br /><span>State the operational outcome before describing the product.</span></div></div>
        <div class="metric"><div class="number">02</div><div><strong>Make proof reviewable</strong><br /><span>Show only customer-approved evidence, integrations, and implementation detail.</span></div></div>
        <div class="metric"><div class="number">03</div><div><strong>Offer one next step</strong><br /><span>Give ${escapeHtml(audience)} a clear working-session path.</span></div></div>
      </aside>
    </section>
    <section id="proof"><div class="eyebrow">Evidence before assertion</div><h2>${escapeHtml(supportingTheme)}</h2><p>${escapeHtml(objective)} This proposal makes the next decision explicit; it makes no claim of measured conversion uplift.</p></section>
    <section id="workflow"><div class="eyebrow">A clearer path</div><h2>${escapeHtml(secondaryTheme)}</h2><div class="grid"><article class="tile"><div class="eyebrow">Understand</div><h3>See the current workflow</h3><p>Lead with the trigger, stakeholder, and operational context.</p></article><article class="tile"><div class="eyebrow">Evaluate</div><h3>Review relevant proof</h3><p>Connect the problem to approved capabilities and implementation expectations.</p></article><article class="tile"><div class="eyebrow">Decide</div><h3>Book the right conversation</h3><p>Use one CTA that routes the buyer to a scoped working session.</p></article></div></section>
    <section id="next-step"><div class="card"><div class="eyebrow">Next step</div><h2>Review this proposed journey with the team.</h2><p>This editable draft requires product, legal, and brand approval before publication.</p><a class="cta" href="mailto:?subject=${encodeURIComponent(cta)}">${escapeHtml(cta)} →</a></div></section>
    <footer>Source: ${escapeHtml(input.source.url)} · Evidence hash: ${sourceHash} · Artifact: ${escapeHtml(input.artifactId)}</footer>
  </main>
</body>
</html>`;

  return {
    id: input.artifactId,
    workspaceId: input.workspaceId,
    status: 'draft',
    sourceUrl: input.source.url,
    sourceCapturedAt: input.source.fetchedAt,
    sourceHash,
    html,
    htmlHash: computeArtifactSha256(html),
    sections: [
      { id: 'hero', label: 'Decision-led hero', purpose: 'State the buyer outcome and one primary CTA.' },
      { id: 'proof', label: 'Evidence frame', purpose: 'Separate approved proof from proposed claims.' },
      { id: 'workflow', label: 'Evaluation path', purpose: 'Explain how a buyer reviews the product.' },
      { id: 'cta', label: 'Approved next step', purpose: 'Route to a working session without autonomous outreach.' },
    ],
  };
}

export function validateLandingArtifactForApproval(input: {
  sourceUrl: string;
  sourceCapturedAt: string | null;
  htmlHash: string;
  previews: LandingArtifactPreviews;
}): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!/^https?:\/\//i.test(input.sourceUrl)) reasons.push('Missing public source URL.');
  if (!input.sourceCapturedAt || Number.isNaN(new Date(input.sourceCapturedAt).getTime())) reasons.push('Missing source capture time.');
  if (!/^[a-f0-9]{64}$/.test(input.htmlHash)) reasons.push('Missing valid HTML artifact hash.');
  if (!input.previews.sourceDesktop) reasons.push('Missing captured desktop source evidence.');
  if (!input.previews.sourceMobile) reasons.push('Missing captured mobile source evidence.');
  if (!input.previews.proposedDesktop) reasons.push('Missing rendered desktop proposal preview.');
  if (!input.previews.proposedMobile) reasons.push('Missing rendered mobile proposal preview.');
  return { ready: reasons.length === 0, reasons };
}
