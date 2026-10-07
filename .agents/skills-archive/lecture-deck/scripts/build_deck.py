# -*- coding: utf-8 -*-
"""Assemble a deck from its folder.

    python scripts/build_deck.py path/to/deck [--theme NAME]

The deck folder holds deck.json, one or more screen modules, and (by convention) storyboard.md.
deck.json:
  {
    "title": "Session one",                 # browser title and overview heading
    "theme": "eduba",                       # shipped theme name, or a path to a theme .json
    "modules": ["screens"],                 # Python modules in the deck folder, each exporting S (a list of slides), in order
    "header_left": "THE PROGRAMME",         # top-left label on every screen
    "header_right": "SESSION 1",            # top-right label, followed by the screen's time band
    "pill": "EDINBURGH | FLORIDA",          # left half of the page pill (optional)
    "output": "out/Session-1.html",         # relative to the deck folder
    "resources": {"interview": "…"}         # texts that copy buttons put on the clipboard (kit.copy_button(key))
  }
"""
import argparse, importlib, json, os, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

ap = argparse.ArgumentParser()
ap.add_argument("deck")
ap.add_argument("--theme", default=None)
args = ap.parse_args()

deck_dir = Path(args.deck).resolve()
cfg = json.loads((deck_dir / "deck.json").read_text(encoding="utf-8"))
theme = args.theme or cfg.get("theme", "eduba")
os.environ["DECK_THEME"] = str(deck_dir / theme) if theme.endswith(".json") and not Path(theme).is_absolute() else theme

from deckkit import kit, shell  # noqa: E402  (kit reads DECK_THEME at import)

sys.path.insert(0, str(deck_dir))
S = []
for m in cfg.get("modules", ["screens"]):
    mod = importlib.import_module(m)
    S += mod.S

e = kit.e
N = len(S)
left = cfg.get("header_left", "")
right = cfg.get("header_right", "")
pill = cfg.get("pill", "")
out = []
for i, s in enumerate(S, 1):
    pct = i / N * 100
    rl = f"{right} / {e(s['time'])}" if right and s.get("time") else (right or e(s.get("time", "")))
    out.append(
        f'<section class="slide {s.get("cls", "")}" id="slide-{i}" data-title="{e(s["title"])}" data-time="{e(s.get("time", ""))}" aria-label="Slide {i}: {e(s["title"])}">'
        f'<div class="card"></div><div class="bar-left">{e(left)}</div><div class="bar-right">{rl}</div>'
        f'<div class="slide-content">{s["content"]}</div>'
        f'<div class="foot">{e(s.get("foot", ""))}</div>'
        f'<div class="pill">{"<span>" + e(pill) + "</span>" if pill else ""}<span>{i:02d} / {N}</span></div>'
        f'<div class="prog" style="width:calc((100% - 28px) * {pct / 100:.4f})"></div>'
        f'<aside hidden>{e(s.get("note", ""))}</aside></section>')

font_url = kit.THEME.get("fonts", {}).get("import", "")
font_link = f'<link rel="preconnect" href="https://fonts.googleapis.com"><link href="{font_url}" rel="stylesheet">' if font_url else ""
body_class = "flat" if kit.THEME.get("chrome") == "flat" else ""
doc = shell.PAGE.format(title=e(cfg.get("title", deck_dir.name)), font_link=font_link, theme_css=kit.theme_css(),
                        body_class=body_class, slides="\n".join(out), resources=json.dumps(cfg.get("resources", {})))
out_path = deck_dir / cfg.get("output", f"out/{deck_dir.name}.html")
if args.theme:
    out_path = out_path.with_name(f"{out_path.stem}-{Path(theme).stem}{out_path.suffix}")
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(doc, encoding="utf-8")
links = re.findall(r"<a |https?://", "\n".join(out))
print(f"wrote {out_path}  screens: {N}  theme: {Path(theme).stem}  size: {len(doc) // 1024} KB  links in screens: {len(links)}")
