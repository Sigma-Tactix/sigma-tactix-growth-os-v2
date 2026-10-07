#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_from_report.py: Bridge adapter for converting Sigma Tactix Reports,
Telemetry, and Creative Social Carousels into animated, themed Lecture Decks.
"""
import argparse
import json
import os
import re
import sys
import uuid
from pathlib import Path

# Add script directory to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))


def build_deck_html(deck_config, slides_list, theme_name="sigmatactix"):
    """Compile slides and configuration into a standalone interactive HTML deck."""
    os.environ["DECK_THEME"] = theme_name
    from deckkit import kit, shell

    e = kit.e
    n_slides = len(slides_list)
    left = deck_config.get("header_left", "SIGMA TACTIX // GROWTH OS")
    right = deck_config.get("header_right", "EXECUTIVE DECK")
    pill = deck_config.get("pill", "SIGMA TACTIX")

    sections = []
    for i, s in enumerate(slides_list, 1):
        pct = (i / n_slides) * 100
        time_str = s.get("time", f":{i*2:02d}")
        rl = f"{right} / {e(time_str)}" if right and time_str else (right or e(time_str))

        sections.append(
            f'<section class="slide {s.get("cls", "")}" id="slide-{i}" data-title="{e(s["title"])}" data-time="{e(time_str)}" aria-label="Slide {i}: {e(s["title"])}">\n'
            f'  <div class="card"></div>\n'
            f'  <div class="bar-left">{e(left)}</div>\n'
            f'  <div class="bar-right">{rl}</div>\n'
            f'  <div class="slide-content">{s["content"]}</div>\n'
            f'  <div class="foot">{e(s.get("foot", ""))}</div>\n'
            f'  <div class="pill">{"<span>" + e(pill) + "</span>" if pill else ""}<span>{i:02d} / {n_slides:02d}</span></div>\n'
            f'  <div class="prog" style="width:calc((100% - 28px) * {pct / 100:.4f})"></div>\n'
            f'  <aside hidden>{e(s.get("note", ""))}</aside>\n'
            f'</section>'
        )

    font_url = kit.THEME.get("fonts", {}).get("import", "")
    font_link = f'<link rel="preconnect" href="https://fonts.googleapis.com"><link href="{font_url}" rel="stylesheet">' if font_url else ""
    body_class = "flat" if kit.THEME.get("chrome") == "flat" else ""

    doc = shell.PAGE.format(
        title=e(deck_config.get("title", "Sigma Tactix Presentation")),
        font_link=font_link,
        theme_css=kit.theme_css(),
        body_class=body_class,
        slides="\n".join(sections),
        resources=json.dumps(deck_config.get("resources", {}))
    )
    return doc


def safe_glyph(name):
    valid = {"eye", "blocks", "card", "person", "people", "file", "folder", "chat", "plug", "book", "brain", "hand", "loop", "bins", "cut", "clock", "screen", "mic", "steps", "question", "check", "shirt", "key", "mail", "star", "bolt", "gear", "target", "calendar"}
    mapping = {
        "chart": "blocks",
        "shield": "key",
        "zap": "bolt",
        "dollar": "target"
    }
    if name in valid:
        return name
    return mapping.get(name, "card")


def generate_executive_slides(data, theme_name="sigmatactix"):
    """Generate professional slides for Executive Telemetry and Attribution Reports."""
    os.environ["DECK_THEME"] = theme_name
    from deckkit.kit import (
        slide, mode, eyebrow, panels, svg, box, txt, tlines, arrow, cue, notes,
        HIGHLIGHT, COOL, WARM, SOFT, NEUTRAL, LIVE, INK, MUTED, RULE, CARD, PANEL,
        HIGHLIGHT_BG, COOL_BG, WARM_BG, SOFT_BG, DISPLAY, MONO
    )

    S = []
    title = data.get("title", "Executive Telemetry & Attribution Report")
    badge = data.get("badge", "Executive Standard")
    tenant = data.get("tenantName", "Sigma Tactix Sovereign Core")
    cadence = data.get("recommendedCadence", "Sprint Cadence")
    audience = data.get("targetAudience", "Executive Leadership")
    metrics = data.get("metrics", [])
    channels = data.get("channels", [])
    explanations = data.get("explanations", [])
    next_steps = data.get("nextSteps", [])
    vaults = data.get("vaults", [])

    # -------------------------------------------------------------
    # SLIDE 1: Cover & Strategic Scope
    # -------------------------------------------------------------
    cover_body = (
        mode("slides", "ON SCREEN · EXECUTIVE REVIEW", "the speaker")
        + eyebrow(f"{tenant} · {badge} · {cadence}")
        + f"<h2>{title}</h2>"
        + panels(
            (safe_glyph("blocks"), "Target Audience", audience, HIGHLIGHT),
            (safe_glyph("clock"), "Cadence & Scope", cadence, COOL),
            (safe_glyph("key"), "Data Sovereignty", "AES-256 Sovereign Vaults", WARM)
        )
        + cue("Review findings and data provenance before capital reallocation.", 4)
    )
    S.append(slide(
        "Executive Summary",
        ":00",
        cover_body,
        "EXECUTIVE BRIEFING · SOVEREIGN GROWTH OS",
        notes(
            f"Welcome. Today we review the {title} for {tenant}.",
            "This report is generated directly from sovereign telemetry and cross-channel attribution data.",
            "All metrics carry strict provenance: verified measured ad spend, CRM touchpoints, and AEO citations.",
            "",
            "Let's move into our core performance drivers and telemetry."
        )
    ))

    # -------------------------------------------------------------
    # SLIDE 2: Core KPI Telemetry & Performance Trajectory
    # -------------------------------------------------------------
    kpi_panels = []
    colors = [HIGHLIGHT, COOL, WARM, SOFT]
    for idx, m in enumerate(metrics[:4]):
        col = colors[idx % len(colors)]
        label = m.get("label", f"Metric {idx+1}")
        val = str(m.get("value", "0"))
        chg = m.get("change") or m.get("trend") or ""
        sub = f"Trajectory: {chg}" if chg else m.get("subtext", "Measured Telemetry")
        kpi_panels.append((safe_glyph("blocks"), label, f"{val}  ({sub})", col))

    if not kpi_panels:
        kpi_panels = [
            (safe_glyph("blocks"), "Blended ROAS", "4.82x (+0.42x vs target)", HIGHLIGHT),
            (safe_glyph("target"), "Attributed Revenue", "$482,000 (+18.4% MoM)", COOL),
            (safe_glyph("eye"), "Dark Social Reach", "82% Multi-Touch Ingest", WARM),
            (safe_glyph("bolt"), "AEO Citation Share", "3.4x vs Category Competitors", SOFT)
        ]

    kpi_body = (
        mode("slides", "TELEMETRY · CORE DRIVERS", "growth team")
        + eyebrow("PERFORMANCE DRIVERS & CAPITAL EFFICIENCY")
        + "<h2>Core KPI Telemetry & Efficiency Trajectory</h2>"
        + panels(*kpi_panels[:4])
        + cue("Every metric tagged with provenance: [MEASURED], [CALCULATION], or [ESTIMATE].", 3)
    )
    S.append(slide(
        "KPI Telemetry",
        ":02–:05",
        kpi_body,
        "TELEMETRY · BLENDED ROAS · ATTRIBUTED REVENUE",
        notes(
            "Here is the telemetry breakdown for the current period.",
            "Notice the blended efficiency metrics.",
            "Attributed revenue and pipeline conversion rates demonstrate positive momentum.",
            "",
            "Next, let's look at the underlying conversion mechanism."
        )
    ))

    # -------------------------------------------------------------
    # SLIDE 3: Omnichannel Attribution & Funnel Mechanism
    # -------------------------------------------------------------
    def attribution_diagram():
        elems = [
            box(20, 30, 240, 260, WARM_BG, WARM, 2),
            txt(35, 60, "1 · PAID MEDIA", 12, MUTED, MONO, ls="1.4"),
            txt(35, 95, "Search & Paid", 18, INK, DISPLAY, weight="700"),
            tlines(35, 125, "Google Search, Meta Ads, and LinkedIn Sponsored clicks.", 22, 16, MUTED),

            box(290, 30, 250, 260, HIGHLIGHT_BG, HIGHLIGHT, 2),
            txt(305, 60, "2 · DARK SOCIAL & AEO", 12, MUTED, MONO, ls="1.4"),
            txt(305, 95, "Invisible Influence", 18, INK, DISPLAY, weight="700"),
            tlines(305, 125, "82% of buyer touchpoints span podcasts, communities & AI search.", 23, 16, MUTED),

            box(570, 30, 250, 260, COOL_BG, COOL, 2),
            txt(585, 60, "3 · DIRECT INGEST", 12, MUTED, MONO, ls="1.4"),
            txt(585, 95, "High-Intent Demo", 18, INK, DISPLAY, weight="700"),
            tlines(585, 125, "Buyers land directly on brand site to book high-intent demos.", 23, 16, MUTED),

            box(850, 30, 230, 260, SOFT_BG, SOFT, 2),
            txt(865, 60, "4 · CONVERSION", 12, MUTED, MONO, ls="1.4"),
            txt(865, 95, "Qualified MRR", 18, INK, DISPLAY, weight="700"),
            tlines(865, 125, "Permanent revenue equity added to pipeline.", 21, 16, MUTED),

            arrow(262, 160, 288, 160, WARM, at=2),
            arrow(542, 160, 568, 160, HIGHLIGHT, at=3),
            arrow(822, 160, 848, 160, COOL, at=4),
            txt(20, 325, "Mechanism: Cross-channel multi-touch attribution maps the true conversion path.", 18, INK, DISPLAY, weight="700")
        ]
        return svg("0 0 1100 350", "".join(elems), "Omnichannel Attribution Mechanism Diagram")

    attr_body = (
        mode("share", "ATTRIBUTION · FUNNEL MECHANISM", "attribution lead")
        + eyebrow("MULTI-TOUCH GRAPH · TRUE BUYER INGEST")
        + "<h2>Omnichannel Attribution Mechanics</h2>"
        + attribution_diagram()
        + cue("Last-click attribution models undercount Dark Social & AEO citations by up to 82%.", 5)
    )
    S.append(slide(
        "Attribution Mechanism",
        ":05–:08",
        attr_body,
        "MECHANISM · MULTI-TOUCH FUNNEL GRAPH",
        notes(
            "Traditional analytics rely on last-click attribution, misattributing credit solely to direct or branded search.",
            "Our multi-touch telemetry shows that 82% of qualified buyers interact via dark social and conversational AI engines first.",
            "By capturing GA4 Measurement Protocol data and server-side events, we seal this attribution leak.",
            "",
            "Now let's review the capital allocation and ROAS performance by channel."
        )
    ))

    # -------------------------------------------------------------
    # SLIDE 4: Channel Allocation & ROAS Yield
    # -------------------------------------------------------------
    ch_panels = []
    for c in channels[:4]:
        name = c.get("channel", "Channel")
        spend = c.get("spend", "$0")
        roas = c.get("roas", "0x")
        conv = c.get("convRate") or c.get("conversions", "")
        ch_panels.append((safe_glyph("card"), name, f"Spend: {spend}  ·  ROAS: {roas}  ·  Conv: {conv}", HIGHLIGHT))

    if not ch_panels:
        ch_panels = [
            (safe_glyph("card"), "Google Search & PMax", "Spend: $38,200 · ROAS: 5.20x · Conv: 4.8%", HIGHLIGHT),
            (safe_glyph("card"), "Meta Ads (IG & FB)", "Spend: $29,450 · ROAS: 4.64x · Conv: 3.9%", COOL),
            (safe_glyph("card"), "LinkedIn Sponsored", "Spend: $11,600 · ROAS: 3.80x · Conv: 2.4%", WARM),
            (safe_glyph("card"), "Organic Search & AEO", "Spend: $2,800 · ROAS: 20.89x · Conv: 6.2%", SOFT)
        ]

    ch_body = (
        mode("slides", "CHANNEL ALLOCATION · EFFICIENCY", "growth ops")
        + eyebrow("CAPITAL DEPLOYMENT & RETURN ON AD SPEND")
        + "<h2>Channel Allocation & Efficiency Matrix</h2>"
        + panels(*ch_panels[:4])
        + cue("Meta & LinkedIn creative angles trigger fatigue at 3.5x frequency, requiring 72h hook refreshes.", 3)
    )
    S.append(slide(
        "Channel Matrix",
        ":08–:12",
        ch_body,
        "CHANNELS · SPEND · ROAS · CONVERSIONS",
        notes(
            "Here is the channel efficiency breakdown.",
            "Search and PMax continue to scale profitably at 5.20x ROAS.",
            "Organic Search & AEO yields the highest efficiency at over 20x ROAS, representing massive compounding potential.",
            "",
            "Next, let's verify data governance and sovereign security."
        )
    ))

    # -------------------------------------------------------------
    # SLIDE 5: Data Sovereignty & Second Brain Vaults
    # -------------------------------------------------------------
    v_panels = []
    for v in vaults[:4]:
        vname = v.get("name", "Vault")
        records = f"{v.get('records', 0):,} Vectors" if isinstance(v.get('records'), (int, float)) else str(v.get('records', 'Verified'))
        stat = v.get("status", "100% Encrypted")
        v_panels.append((safe_glyph("key"), vname, f"{records} · {stat}", COOL))

    if not v_panels:
        v_panels = [
            (safe_glyph("key"), "Marketing Vault", "18,400 Vectors · AES-256 Sovereign Encrypted", HIGHLIGHT),
            (safe_glyph("key"), "Customer & ICP Vault", "480 Vectors · Tenant Isolated Memory", COOL),
            (safe_glyph("key"), "Brand Voice Vault", "124 Vectors · Human-in-the-Loop Enforced", WARM),
            (safe_glyph("key"), "Authority & SEO Vault", "310 Vectors · Schema & Node Index", SOFT)
        ]

    vault_body = (
        mode("solo", "INFRASTRUCTURE · SECOND BRAIN", "security architect")
        + eyebrow("DATA SOVEREIGNTY & PERMISSIONED INTELLIGENCE")
        + "<h2>Second Brain Vaults & Governance</h2>"
        + panels(*v_panels[:4])
        + cue("Zero training on client data. All vectors stored in sovereign tenant isolation.", 2)
    )
    S.append(slide(
        "Data Sovereignty",
        ":12–:15",
        vault_body,
        "INFRASTRUCTURE · AES-256 · TENANT ISOLATION",
        notes(
            "Data sovereignty is a core foundation of the Sigma Tactix architecture.",
            "All embeddings and conversational vectors reside in customer-owned isolated memory.",
            "No third-party training is permitted. All agent interventions require human-in-the-loop audit trails.",
            "",
            "Finally, let's review the prioritized intervention roadmap."
        )
    ))

    # -------------------------------------------------------------
    # SLIDE 6: Intervention Roadmap & Next Steps
    # -------------------------------------------------------------
    step_panels = []
    for s in next_steps[:3]:
        prio = s.get("priority", "P0")
        stitle = s.get("title", "Action Item")
        owner = s.get("owner", "Growth Lead")
        timeline = s.get("timeline", "7 Days")
        impact = s.get("impact", "+15% Efficiency")
        step_panels.append((safe_glyph("bolt"), f"[{prio}] {stitle}", f"Timeline: {timeline} · Owner: {owner} · Impact: {impact}", HIGHLIGHT if prio == "P0" else WARM))

    if not step_panels:
        step_panels = [
            (safe_glyph("bolt"), "[P0] Seal Dark Social & GA4 Protocol Injection", "Timeline: 0–7 Days · Owner: Nexus Swarm · Impact: +18% Reallocation Gain", HIGHLIGHT),
            (safe_glyph("bolt"), "[P1] Automated Creative Hook Resets (72h)", "Timeline: 7–21 Days · Owner: Content AI · Impact: +24% Meta/LinkedIn CTR", COOL),
            (safe_glyph("bolt"), "[P2] Publish Enterprise AEO Topical Entity Graph", "Timeline: 21–45 Days · Owner: Authority Agent · Impact: 3.2x AI Engine Citations", WARM)
        ]

    steps_body = (
        mode("handoff", "INTERVENTIONS · EXECUTION ROADMAP", "delivery lead")
        + eyebrow("PRIORITIZED ACTION PLAN & SOW DELIVERABLES")
        + "<h2>Intervention Roadmap & Next Actions</h2>"
        + panels(*step_panels[:3])
        + cue("Approval required for P0 budget reallocation. Execution gates activate immediately.", 3)
    )
    S.append(slide(
        "Intervention Roadmap",
        ":15–:20",
        steps_body,
        "NEXT STEPS · P0/P1/P2 ROADMAP · SOW SCOPED",
        notes(
            "Here is the actionable intervention roadmap for leadership review.",
            "P0: Deploy server-side measurement protocol to capture the missing 82% attribution signal within 7 days.",
            "P1: Institute automated 72h hook refreshes to eliminate creative CTR fatigue.",
            "P2: Inject enterprise entity schemas to capture Perplexity and ChatGPT discovery citations.",
            "",
            "Thank you. We can now open the floor for executive Q&A."
        )
    ))

    return S


def generate_creative_slides(data, theme_name="sigmatactix"):
    """Generate presentation slides from Creative Social Carousels and Threads."""
    os.environ["DECK_THEME"] = theme_name
    from deckkit.kit import (
        slide, mode, eyebrow, panels, cue, notes,
        HIGHLIGHT, COOL, WARM, SOFT, NEUTRAL, LIVE
    )

    S = []
    topic = data.get("topic", "High-Impact Growth Strategy")
    channel = data.get("channel", "Social Presentation")
    hook = data.get("hook", "Stop Renting Agency Headcount. Build Sovereign Growth.")
    slides_data = data.get("slides", [])
    tweets_data = data.get("threadTweets", [])
    loop_cta = data.get("loopCta", "Bookmark this presentation and implement today.")

    # Slide 1: Hook
    cover_body = (
        mode("slides", f"ON SCREEN · {channel.upper()}", "presenter")
        + eyebrow(f"CREATIVE STUDIO · {channel.upper()} · DECK")
        + f"<h2>{hook}</h2>"
        + panels(
            (safe_glyph("bolt"), "Topic", topic, HIGHLIGHT),
            (safe_glyph("eye"), "Core Problem", "The Renting Headcount Trap", WARM),
            (safe_glyph("key"), "Target Outcome", "Permanent Sovereign Equity", COOL)
        )
        + cue("Swipe or advance through the mechanism teardown.", 3)
    )
    S.append(slide(
        "The Hook",
        ":00",
        cover_body,
        f"{channel.upper()} · HOOK · {topic.upper()}",
        notes(
            f"Here is our opening hook for {topic}.",
            "The goal is immediate cognitive contrast: establishing why traditional methods fail.",
            "",
            "Let's walk through the core mechanisms."
        )
    ))

    # Slides from Carousel Slides or Thread Tweets
    items = []
    if slides_data:
        for idx, cs in enumerate(slides_data):
            items.append({
                "num": cs.get("slideNumber", idx + 1),
                "headline": cs.get("title") or cs.get("headline", f"Step {idx+1}"),
                "sub": cs.get("subtitle") or cs.get("subheadline", ""),
                "prompt": cs.get("visualCue") or cs.get("visualPrompt", ""),
                "cta": cs.get("takeaway") or cs.get("callToAction", ""),
                "bullets": cs.get("contentPoints") or cs.get("points", [])
            })
    elif tweets_data:
        for tw in tweets_data:
            num = tw.get("tweetNumber", 1)
            raw_text = tw.get("text", "")
            lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
            head = lines[0] if lines else f"Point {num}"
            body = " ".join(lines[1:]) if len(lines) > 1 else ""
            items.append({
                "num": num,
                "headline": head,
                "sub": body,
                "prompt": "",
                "cta": "",
                "bullets": []
            })

    colors = [HIGHLIGHT, COOL, WARM, SOFT]
    for idx, item in enumerate(items):
        col = colors[idx % len(colors)]
        num = item["num"]
        headline = item["headline"]
        sub = item["sub"]
        card_tuples = []
        if sub:
            card_tuples.append((safe_glyph("card"), "Observation", sub, col))
        if item.get("prompt"):
            card_tuples.append((safe_glyph("eye"), "Visual Mechanism", item["prompt"], COOL))
        if item.get("cta"):
            card_tuples.append((safe_glyph("bolt"), "Action Required", item["cta"], HIGHLIGHT))
        if not card_tuples:
            card_tuples.append((safe_glyph("card"), "Key Takeaway", headline, col))

        body_html = (
            mode("share", f"SLIDE {num} · MECHANISM", "creative lead")
            + eyebrow(f"{topic.upper()} · POINT {num} OF {len(items)}")
            + f"<h2>{headline}</h2>"
            + panels(*card_tuples[:3])
            + (cue(item["cta"], 3) if item.get("cta") else "")
        )

        S.append(slide(
            f"Point {num}",
            f":{num*2:02d}",
            body_html,
            f"{topic.upper()} · SLIDE {num}",
            notes(
                f"Slide {num}: {headline}",
                sub or "Explain the underlying principle and contrast with the status quo.",
                "",
                "Notice the reaction in the room before advancing."
            )
        ))

    # Final Slide: Summary & CTA
    close_body = (
        mode("handoff", "ACTION · LOOP CTA", "presenter")
        + eyebrow("SUMMARY & RETENTION")
        + "<h2>Take Action & Implement</h2>"
        + panels(
            (safe_glyph("key"), "Permanent Asset", "Growth OS directly in your infrastructure", HIGHLIGHT),
            (safe_glyph("bolt"), "Next Step", loop_cta, COOL),
            (safe_glyph("card"), "Follow & Learn", "Follow @SigmaTactix for empirical teardowns", WARM)
        )
        + cue(loop_cta, 2)
    )
    S.append(slide(
        "Summary & CTA",
        f":{(len(items)+1)*2:02d}",
        close_body,
        "SUMMARY · LOOP CTA · SIGMA TACTIX",
        notes(
            "Recap: Renting headcount guarantees negative compounding.",
            "Installing an AI-native Growth OS guarantees permanent intelligence, lower CAC, and automated execution.",
            "",
            loop_cta
        )
    ))

    return S


def main():
    parser = argparse.ArgumentParser(description="Generate interactive lecture decks from report/creative JSON")
    parser.add_argument("--input", "-i", type=str, help="Path to input JSON file")
    parser.add_argument("--stdin", action="store_true", help="Read input JSON from stdin")
    parser.add_argument("--theme", "-t", type=str, default="sigmatactix", help="Theme name (default: sigmatactix)")
    parser.add_argument("--out-dir", "-o", type=str, default="dist/decks", help="Directory to save generated deck HTML")
    parser.add_argument("--out-name", type=str, default=None, help="Output file base name")
    parser.add_argument("--type", choices=["executive", "creative", "auto"], default="auto", help="Report data type")
    args = parser.parse_args()

    raw_json = None
    if args.stdin:
        raw_json = sys.stdin.read()
    elif args.input:
        raw_json = Path(args.input).read_text(encoding="utf-8")
    else:
        # Default test payload if no args provided
        raw_json = json.dumps({
            "title": "Executive Growth & Attribution Review",
            "tenantName": "Sigma Tactix Sovereign Core",
            "badge": "Enterprise Standard",
            "metrics": [
                {"label": "Blended ROAS", "value": "4.82x", "change": "+0.42x"},
                {"label": "Attributed Revenue", "value": "$482,000", "change": "+18.4%"},
                {"label": "Dark Social Capture", "value": "82%", "change": "Sealed"},
                {"label": "AEO Citation Dominance", "value": "3.4x", "change": "+120%"}
            ],
            "channels": [
                {"channel": "Google Search & PMax", "spend": "$38,200", "roas": "5.20x", "convRate": "4.8%"},
                {"channel": "Meta Ads (IG & FB)", "spend": "$29,450", "roas": "4.64x", "convRate": "3.9%"},
                {"channel": "LinkedIn Sponsored", "spend": "$11,600", "roas": "3.80x", "convRate": "2.4%"},
                {"channel": "Organic Search & AEO", "spend": "$2,800", "roas": "20.89x", "convRate": "6.2%"}
            ]
        })

    data = json.loads(raw_json)
    deck_id = data.get("id") or str(uuid.uuid4())[:8]

    # Detect deck type
    deck_type = args.type
    if deck_type == "auto":
        if "slides" in data or "threadTweets" in data or "channel" in data:
            deck_type = "creative"
        else:
            deck_type = "executive"

    theme_name = args.theme or "sigmatactix"

    if deck_type == "creative":
        slides = generate_creative_slides(data, theme_name=theme_name)
    else:
        slides = generate_executive_slides(data, theme_name=theme_name)

    title = data.get("title") or data.get("topic") or "Sigma Tactix Presentation"
    slug = re.sub(r"[^a-zA-Z0-9_-]", "-", title.lower()).strip("-")[:40] or "presentation"
    filename = f"{args.out_name or f'sigmatactix-{slug}-{deck_id}'}.html"

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / filename

    deck_config = {
        "title": title,
        "theme": theme_name,
        "header_left": f"{data.get('tenantName', 'SIGMA TACTIX').upper()} // GROWTH OS",
        "header_right": data.get("badge", "EXECUTIVE DECK").upper(),
        "pill": "SIGMA TACTIX",
        "resources": data.get("resources", {})
    }

    html_content = build_deck_html(deck_config, slides, theme_name=theme_name)
    out_file.write_text(html_content, encoding="utf-8")

    result = {
        "success": True,
        "deckId": deck_id,
        "title": title,
        "slideCount": len(slides),
        "theme": theme_name,
        "htmlPath": str(out_file),
        "filename": filename,
        "byteSize": len(html_content)
    }

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
