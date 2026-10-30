import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Lecture Deck Generation & Standards Verification', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const generatorScript = path.join(rootDir, 'tools/lecture-deck-skill/scripts/generate_from_report.py');
  const checkTextScript = path.join(rootDir, 'tools/lecture-deck-skill/scripts/check_text.py');
  const themeFile = path.join(rootDir, 'tools/lecture-deck-skill/scripts/deckkit/themes/sigmatactix.json');
  const outputDir = path.join(rootDir, 'dist/decks/test-verification');
  const hasLectureDeck = fs.existsSync(generatorScript) && fs.existsSync(checkTextScript) && fs.existsSync(themeFile);

  it.skipIf(!hasLectureDeck)('has all necessary upstream lecture-deck scripts and themes in place', () => {
    expect(fs.existsSync(generatorScript)).toBe(true);
    expect(fs.existsSync(checkTextScript)).toBe(true);
    expect(fs.existsSync(themeFile)).toBe(true);

    const themeContent = JSON.parse(fs.readFileSync(themeFile, 'utf-8'));
    expect(themeContent.colors.bg).toBe('#09090B');
    expect(themeContent.colors.highlight).toBe('#FF481B');
    expect(themeContent.fonts.display).toContain('Plus Jakarta Sans');
  });

  it.skipIf(!hasLectureDeck)('generates an Executive Telemetry & Attribution deck that passes check_text standards', () => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const payload = {
      title: 'Q4 Sovereign Growth Telemetry Review',
      badge: 'Enterprise Standard',
      tenantName: 'Acme Global SaaS',
      recommendedCadence: 'Sprint Cadence',
      targetAudience: 'Executive Board',
      metrics: [
        { label: 'Blended ROAS', value: '4.82x', change: '+0.42x', provenance: 'MEASURED' },
        { label: 'Attributed Revenue', value: '$482,000', change: '+18.4%', provenance: 'MEASURED' },
        { label: 'Dark Social Capture', value: '82%', change: 'Sealed', provenance: 'CALCULATION' },
        { label: 'AEO Citation Dominance', value: '3.4x', change: '+120%', provenance: 'MEASURED' }
      ],
      channels: [
        { channel: 'Google Search & PMax', spend: '$38,200', roas: '5.20x', convRate: '4.8%' },
        { channel: 'Meta Ads (IG & FB)', spend: '$29,450', roas: '4.64x', convRate: '3.9%' }
      ],
      nextSteps: [
        { priority: 'P0', title: 'Seal Dark Social & GA4 Protocol Injection', timeline: '0–7 Days', owner: 'Nexus Swarm', impact: '+18% Reallocation Gain' },
        { priority: 'P1', title: 'Automated Creative Hook Resets (72h)', timeline: '7–21 Days', owner: 'Content AI', impact: '+24% Meta/LinkedIn CTR' }
      ]
    };

    const genRes = spawnSync('python3', [
      generatorScript,
      '--stdin',
      '--theme', 'sigmatactix',
      '--out-dir', outputDir,
      '--type', 'executive'
    ], {
      input: JSON.stringify(payload),
      encoding: 'utf-8'
    });

    expect(genRes.status).toBe(0);
    const parsed = JSON.parse(genRes.stdout.trim());
    expect(parsed.success).toBe(true);
    expect(parsed.slideCount).toBe(6);
    expect(fs.existsSync(parsed.htmlPath)).toBe(true);

    const html = fs.readFileSync(parsed.htmlPath, 'utf-8');
    // Verify slide sections and accessibility
    expect(html).toContain('<section class="slide');
    expect(html).toContain('aria-label="Slide');
    // Verify mode strip on screens
    expect(html).toContain('class="mode mode-');
    // Verify speaker notes with standard triggers
    expect(html).toContain('<aside hidden>');
    expect(html).toContain('SAY');
    expect(html).toContain('DO NOW');
    expect(html).toContain('LOOK FOR');
    expect(html).toContain('BRIDGE');
    // Verify sovereign theme css applied
    expect(html).toContain('--bg:#09090B');
    expect(html).toContain('--highlight:#FF481B');
    // Verify print media support
    expect(html).toContain('@media print');

    // Run check_text.py against the generated deck
    const checkRes = spawnSync('python3', [
      checkTextScript,
      parsed.htmlPath,
      '--allow-contrasts=1'
    ], {
      encoding: 'utf-8'
    });

    expect(checkRes.status).toBe(0);
    expect(checkRes.stdout).toContain('hard failures: 0');
  });

  it.skipIf(!hasLectureDeck)('generates a Creative Social Carousel deck that passes check_text standards', () => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const payload = {
      channel: 'LinkedIn',
      topic: 'Why Traditional Agency Retainers Fail SaaS Founders',
      slides: [
        {
          title: 'The Hidden CAC Tax',
          content: 'Agencies bill hours regardless of pipeline velocity, shifting downside risk to founders.',
          type: 'text'
        },
        {
          title: 'Sovereign Growth Infrastructure',
          content: 'Deploying automated algorithmic workflows creates permanent internal IP and predictable pipeline.',
          type: 'quote'
        }
      ]
    };

    const genRes = spawnSync('python3', [
      generatorScript,
      '--stdin',
      '--theme', 'sigmatactix',
      '--out-dir', outputDir,
      '--type', 'creative'
    ], {
      input: JSON.stringify(payload),
      encoding: 'utf-8'
    });

    expect(genRes.status).toBe(0);
    const parsed = JSON.parse(genRes.stdout.trim());
    expect(parsed.success).toBe(true);
    expect(parsed.slideCount).toBe(4); // Hook + 2 slides + CTA
    expect(fs.existsSync(parsed.htmlPath)).toBe(true);

    const html = fs.readFileSync(parsed.htmlPath, 'utf-8');
    expect(html).toContain('The Hidden CAC Tax');
    expect(html).toContain('Sovereign Growth Infrastructure');
    expect(html).toContain('Take Action & Implement');

    // Run check_text.py against the creative deck
    const checkRes = spawnSync('python3', [
      checkTextScript,
      parsed.htmlPath,
      '--allow-contrasts=1'
    ], {
      encoding: 'utf-8'
    });

    expect(checkRes.status).toBe(0);
    expect(checkRes.stdout).toContain('hard failures: 0');
  });
});
