# kit API

`from deckkit.kit import *` inside a screen module. The theme is loaded from `DECK_THEME` (set by `build_deck.py`) before import.

## Screens and notes

- `slide(title, time, content, foot, note, cls="")` → a screen dict. `title` shows in the overview; `time` in the header ("`:33–:34`", "10 min"); `foot` is the mono line at the bottom left.
- `notes(say, do, look, stuck, bridge, ahead)` → the notes string, with the six headings the notes panel styles.
- `mode(kind, label, who)` → the strip at the top of every screen. `kind` in `slides share breakout solo handoff break`.

## HTML blocks

- `eyebrow(text)` small mono line above the header.
- `path(*lines, start=0)` numbered statements, each animating in sequence from delay `start`.
- `cue(text, i=None)` the caption or instruction line. `fnote(text, i=None)` a mono footnote.
- `chat(*(label, text), start=0, cls="")` labelled blocks; `cls="prompt"` for long pasted text at 15.5px.
- `panels(*(glyph, heading, body, colour), cols=3, start=0, size=19)` a grid of panels with a glyph each. `glyph` is a glyph name or your own inline `<svg>`.
- `ideas(*(label, text, colour), cols=3, start=0)` smaller chips.
- `two_col(left_html, right_html, ratio="1fr 1fr")`.
- `copy_button(key, label)` copies `resources[key]` from `deck.json` to the clipboard.
- `photo(path, size=92, border=None)` a round photo embedded as a data URI (jpg or png under 900 KB).
- `glyph(name, size=38)` an inline glyph in the current text colour. Names: `GLYPHS` (eye, blocks, card, person, people, file, folder, chat, plug, book, brain, hand, loop, bins, cut, clock, screen, mic, steps, question, check, shirt, key, mail, star, bolt, gear, target, calendar).

## Animation attributes

Append to any tag. `i` is a delay index (× 0.35 s), fractional allowed, keep the largest on a screen at 6.

- `anim(i)` fade and rise · `slide_in(i)` from the left · `drop(i)` from above · `fade(i)` dims to 25% (for "this goes")
- `draw(i)` on a path, line or circle: the stroke draws in (adds `pathLength="1"`)
- `grow(i)` a rect grows from its left edge · `rise(i)` from its base
- `march()` on a dashed path: the dashes march; fade the path in with `anim`, never `draw` it

An element with its own `transform` attribute (a `figure`, a `glyph_svg`) must be wrapped: `f'<g{anim(2)}>' + figure(...) + '</g>'`.

## SVG helpers

- `svg(viewBox, body, label, top="1%")` wraps a diagram. `0 0 1100 420` is the largest viewBox that fits under a header with one caption.
- `txt(x, y, s, size=16, fill, font, weight, anchor, ls, extra="")` text; `extra` takes an animation attribute.
- `box(x, y, w, h, fill, stroke, sw=1.5, rx=12, dash="", extra="")`.
- `arrow(x1, y1, x2, y2, color, dashed, width, extra, at=None)` a straight arrow; with `at=i` the shaft draws and the head fades in as it lands.
- `curve(path_d, end=(x, y, angle), color, dashed, width, extra, at=None)` a curved arrow.
- `fchip(x, y, name, color, w, extra)` a file chip · `chip(x, y, label, color, fill, w, extra)` a pill · `badge(n, x, y, color, r, fg)` a numbered disc.
- `wrap(s, width_chars)` · `tlines(x, y, s, width_chars, size, fill, lh, font, weight, anchor)` multi-line text · `fits(s, width_px, size, mono)` a rough width check.
- `glyph_svg(name, x, y, size, color, extra)` a glyph inside a bigger SVG.

## The cast

- `figure(x, y, color=HIGHLIGHT, lean=0, size=56)` a person with feet at (x, y); `lean` in degrees.
- `machine(x, y, w=110, h=80, color=COOL, concave=0)` a rounded block with an eye; `concave` bends its left side toward a person.
- `rigid(x, y, w, h, color=WARM)` a square-cornered box: what is written down, or the old product.

## Common pictures

- `strip(n, lit={i: colour}, x, y, w, labels={i: text}, at=0)` a row of blocks, some lit.
- `timeline_bar(segments, total, y, h, x, w, at)` a run-of-show bar; `segments` are `(minutes, label, sublabel, colour, text_colour)`, growing in left to right.
- `legend(items, x, y, at)` with `items` as `(colour, label)`.

## Constants

`BG CARD PANEL INK MUTED RULE ON_BG WHITE HIGHLIGHT COOL WARM SOFT NEUTRAL LIVE HIGHLIGHT_BG COOL_BG WARM_BG SOFT_BG DISPLAY MONO MODES THEME`.
