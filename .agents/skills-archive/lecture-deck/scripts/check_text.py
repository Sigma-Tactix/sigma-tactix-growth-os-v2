# -*- coding: utf-8 -*-
"""Register and structure checks on a built deck. Exit code 1 if any hard check fails.

    python scripts/check_text.py path/to/deck/out/Deck.html [--dump] [--allow-contrasts N]

Hard checks: dashes in prose, staged openers, method vocabulary, a missing mode strip, live colour outside
the mode dot. Soft checks (printed, not fatal): stock AI words, contrast constructions beyond the allowance,
possible fragments. --dump prints every screen's visible text and notes for a read-through.
"""
import html, re, sys
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith("--")]
flags = [a for a in sys.argv[1:] if a.startswith("--")]
deck = Path(args[0]).resolve()
allow = 1
for f in flags:
    if f.startswith("--allow-contrasts"):
        allow = int(f.split("=")[1]) if "=" in f else 1
s = deck.read_text(encoding="utf-8")
secs = re.findall(r"<section[^>]*>.*?</section>", s, re.S)
live = re.search(r"--live:(#[0-9A-Fa-f]{6})", s)
live = live.group(1).lower() if live else None

STOCK = ["crucial", "pivotal", "robust", "delve", "landscape", "journey", "unlock", "leverage", "seamless", "empower", "game-changer",
         "supercharge", "elevate", "harness", "tapestry", "testament", "showcase", "vibrant", "meticulous", "underscore", "foster",
         "enhance", "additionally", "furthermore", "moreover", "utilize", "utilise"]
CONTRAST = [r"\bnot (just|only|merely|simply)\b", r"\bit is not\b[^.]{0,60}\bit is\b", r"\bit's not\b[^.]{0,60}\bit's\b", r"\brather than\b", r"\bis not about\b", r"\bisn't about\b"]
STAGED = [r"\blet's dive\b", r"\bhere's the thing\b", r"\bhere is the thing\b", r"\breal talk\b", r"\bto be clear\b", r"\bthe real question\b", r"\bat its core\b", r"\bread that again\b", r"\blet that sink in\b"]
METHOD = ["ICM", "L1", "L2", "L3", "context engineering", "agentic"]

hard = 0
contrasts = 0
report = []
for i, sec in enumerate(secs, 1):
    title = re.search(r'data-title="([^"]*)"', sec).group(1)
    note = re.search(r"<aside hidden>(.*?)</aside>", sec, re.S)
    note = html.unescape(note.group(1)) if note else ""
    body = re.sub(r"<aside hidden>.*?</aside>", "", sec, flags=re.S)
    svgs = re.findall(r"<svg.*?</svg>", body, re.S)
    nosvg = re.sub(r"<svg.*?</svg>", "", body, flags=re.S)
    svgtext = " ".join(html.unescape(t) for sv in svgs for t in re.findall(r"<text[^>]*>(.*?)</text>", sv, re.S))
    chrome = re.findall(r'class="(?:bar-left|bar-right|foot|pill)"[^>]*>(.*?)</div>', nosvg, re.S)
    vis = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", nosvg)))
    for c in chrome:
        vis = vis.replace(html.unescape(re.sub(r"<[^>]+>", " ", c)).strip(), " ")
    text = vis + " " + svgtext
    allt = text + " " + note

    def flag(kind, msg, is_hard=False):
        global hard
        report.append(f"[{i:02d} {title}] {kind}: {msg}")
        if is_hard:
            hard += 1

    prose = re.sub(r"[:\d]+–[:\d]+", "", allt)
    if "—" in prose or "–" in prose:
        m = re.search(r".{0,40}[—–].{0,40}", prose)
        flag("DASH", m.group(0) if m else "", True)
    for w in STOCK:
        if re.search(rf"\b{w}\b", allt, re.I):
            flag("STOCK WORD", w)
    for p in CONTRAST:
        for m in re.finditer(p, allt, re.I):
            contrasts += 1
            flag("CONTRAST", allt[max(0, m.start() - 50):m.end() + 50].strip())
    for p in STAGED:
        if re.search(p, allt, re.I):
            flag("STAGED", p, True)
    for m in re.finditer(r"(?:^|[.!?]\s+)([A-Z][a-z]+(?: [a-z]+){0,2})\.", vis):
        if m.group(1).lower() not in ("swap", "break", "close"):
            flag("FRAGMENT?", m.group(1))
    for w in METHOD:
        if re.search(rf"\b{re.escape(w)}\b", vis):
            flag("METHOD WORD", w, True)
    if live and live in body.lower():
        flag("LIVE COLOUR", "used in a diagram; it belongs only to the mode dot", True)
    if 'class="mode' not in body:
        flag("NO MODE STRIP", "", True)
    if "--dump" in flags:
        print(f"\n===== {i:02d} · {title}\n{vis.strip()}\n--- notes ---\n{note.strip()}")

print(f"\nscreens: {len(secs)}")
for r in report:
    print(r)
if contrasts > allow:
    print(f"\ncontrast constructions: {contrasts} (allowance {allow})")
    hard += 1
print(f"\nhard failures: {hard}")
sys.exit(1 if hard else 0)
