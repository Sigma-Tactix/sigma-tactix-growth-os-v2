# -*- coding: utf-8 -*-
"""Scaffold a new deck folder.

    python scripts/new_deck.py path/to/my-deck --title "Session one" --theme eduba --left "MY PROGRAMME" --right "SESSION 1"
"""
import argparse, json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ap = argparse.ArgumentParser()
ap.add_argument("path")
ap.add_argument("--title", default="Untitled deck")
ap.add_argument("--theme", default="eduba")
ap.add_argument("--left", default="")
ap.add_argument("--right", default="")
a = ap.parse_args()
d = Path(a.path).resolve()
d.mkdir(parents=True, exist_ok=True)
(d / "deck.json").write_text(json.dumps({
    "title": a.title, "theme": a.theme, "modules": ["screens"], "header_left": a.left, "header_right": a.right,
    "pill": "", "output": f"out/{d.name}.html", "resources": {}}, indent=2), encoding="utf-8")
(d / "storyboard.md").write_text((HERE.parent / "reference" / "storyboard-template.md").read_text(encoding="utf-8"), encoding="utf-8")
(d / "screens.py").write_text('''# -*- coding: utf-8 -*-
"""Screens for this deck. Export S: a list of slide(...) dicts in order. See reference/kit-api.md."""
from deckkit.kit import *

S = []

S.append(slide("Cover", ":00",
    mode("slides", "ON SCREEN · SLIDES", "the speaker")
    + eyebrow("THE PROGRAMME · SESSION 1")
    + "<h2>A first claim, stated as a sentence.</h2>"
    + path("What the session is for, in one line.",
           "What people leave with.",
           "What happens first.")
    + cue("One instruction for the room.", 3),
    "A FOOT LINE IN MONO",
    notes("What the speaker says, in first person, in full sentences.",
          "What to click, share or hand over.",
          "What the room should be doing.",
          "",
          "The last sentence before the next screen.")))
''', encoding="utf-8")
print(f"scaffolded {d}\n  build:  python {HERE / 'build_deck.py'} {d}\n  render: python {HERE / 'render.py'} {d / 'out' / (d.name + '.html')}")
