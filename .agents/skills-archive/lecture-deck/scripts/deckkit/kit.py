# -*- coding: utf-8 -*-
"""deckkit.kit: everything a screen module needs. `from deckkit.kit import *`.

The theme is chosen before this module is imported: build_deck.py sets the DECK_THEME
environment variable from deck.json. Colour constants below are role names, so a screen
written for one theme renders correctly in any other:

  HIGHLIGHT  the subject, "you", now, the thing to look at first
  COOL       the system, the machine, anything automatic
  WARM       what is written down, human artefacts, files
  SOFT       the other party: the customer, the partner, the reader
  NEUTRAL    chips, gaps, not-yet, background structure
  LIVE       the live dot in the mode strip, and nothing else
  INK / MUTED / RULE / CARD / PANEL / BG  the surfaces and text

Animation attributes, all with a delay index i (fractional allowed, largest on a screen 6):
  anim(i) fade and rise · slide_in(i) from the left · drop(i) from above · draw(i) stroke draws
  grow(i) bar grows from its left edge · rise(i) grows from its base · fade(i) dims to 25%
  data-march on a dashed path makes it march (fade it in with anim; never also draw it)
"""
import html, json, os, math
from pathlib import Path

HERE = Path(__file__).resolve().parent
THEMES = HERE / "themes"


def load_theme(name=None):
    name = name or os.environ.get("DECK_THEME", "eduba")
    p = Path(name) if str(name).endswith(".json") else THEMES / f"{name}.json"
    if not p.exists():
        raise SystemExit(f"theme not found: {p} (shipped themes: {', '.join(sorted(t.stem for t in THEMES.glob('*.json')))})")
    return json.loads(p.read_text(encoding="utf-8"))


THEME = load_theme()
_c = THEME["colors"]
BG, CARD, PANEL = _c["bg"], _c["card"], _c["panel"]
INK, MUTED, RULE, ON_BG = _c["ink"], _c["muted"], _c["rule"], _c["on_bg"]
HIGHLIGHT, COOL, WARM, SOFT, NEUTRAL, LIVE = _c["highlight"], _c["cool"], _c["warm"], _c["soft"], _c["neutral"], _c["live"]
HIGHLIGHT_BG, COOL_BG, WARM_BG, SOFT_BG = _c["highlight_bg"], _c["cool_bg"], _c["warm_bg"], _c["soft_bg"]
WHITE = _c.get("white", "#FFFFFF")
DISPLAY = THEME["fonts"]["display"]
MONO = THEME["fonts"]["mono"]
SANS = DISPLAY
MODES = THEME.get("modes", {"slides": INK, "share": HIGHLIGHT, "breakout": COOL, "solo": LIVE, "handoff": WARM, "break": NEUTRAL})


def theme_css():
    """The :root variables the shell reads."""
    m = MODES
    return (":root{" + f"--bg:{BG};--card:{CARD};--panel:{PANEL};--ink:{INK};--muted:{MUTED};--rule:{RULE};--on-bg:{ON_BG};"
            f"--rule-on-bg:{_c.get('rule_on_bg', 'rgba(255,255,255,.18)')};--highlight:{HIGHLIGHT};--cool:{COOL};--warm:{WARM};--soft:{SOFT};--neutral:{NEUTRAL};--live:{LIVE};"
            f"--mode-slides:{m['slides']};--mode-share:{m['share']};--mode-breakout:{m['breakout']};--mode-solo:{m['solo']};--mode-handoff:{m['handoff']};--mode-break:{m['break']};"
            f"--display:{DISPLAY};--mono:{MONO}" + "}")


def e(s):
    return html.escape(str(s), quote=False)


# ---------------------------------------------------------------- slide and notes
def notes(say="", do="", look="", stuck="", bridge="", ahead=""):
    """Speaker notes. Keys are shown as headings in the notes panel."""
    parts = []
    for k, v in (("SAY", say), ("DO NOW", do), ("LOOK FOR", look), ("IF STUCK", stuck), ("IF THE ROOM IS AHEAD", ahead), ("BRIDGE", bridge)):
        if v:
            parts.append(f"{k}\n{v}")
    return "\n\n".join(parts)


def slide(title, time, content, footer, note, cls=""):
    """title: short name for the overview. time: the band in the header, e.g. ':33–:34' or '10 min'."""
    return dict(title=title, time=time, content=content, foot=footer, note=note, cls=cls)


def _attr(kind, i, style=""):
    s = f"--d:{i}" + (f";{style}" if style else "")
    return f' data-{kind}="1" style="{s}"'


def anim(i, style=""):
    return f' data-in="{i}" style="--d:{i}' + (f';{style}' if style else '') + '"'


def slide_in(i, style=""):
    return _attr("slide", i, style)


def drop(i, style=""):
    return _attr("drop", i, style)


def fade(i, style=""):
    return _attr("fade", i, style)


def draw(i):
    return f' data-draw="1" pathLength="1" style="--d:{i}"'


def grow(i):
    return f' data-grow="1" style="--d:{i}"'


def rise(i):
    return f' data-rise="1" style="--d:{i}"'


def march():
    return ' data-march="1"'


def mode(kind, label, who=""):
    """The strip at the top of every screen: who has the screen and what is happening. kind in MODES."""
    w = f"<span>{e(who)}</span>" if who else ""
    return f'<div class="mode mode-{kind}"><i></i><b>{e(label)}</b>{w}</div>'


# ---------------------------------------------------------------- html blocks
def eyebrow(t):
    return f'<div class="eyebrow">{t}</div>'


def path(*items, start=0):
    """Numbered statements, each animating in sequence."""
    return '<div class="click-path">' + "".join(
        f"<p{anim(start + i)}><b>{i + 1}</b>{x}</p>" for i, x in enumerate(items)) + "</div>"


def cue(t, i=None):
    return f'<p class="teaching-cue"{anim(i) if i is not None else ""}>{t}</p>'


def fnote(t, i=None):
    return f'<p class="footnote"{anim(i) if i is not None else ""}>{t}</p>'


def chat(*pairs, start=0, cls=""):
    """Labelled blocks. cls='prompt' for a long pasted prompt (smaller type)."""
    c = f' {cls}' if cls else ""
    return f'<div class="chat-model{c}">' + "".join(
        f"<p{anim(start + i)}><b>{k}</b>{v}</p>" for i, (k, v) in enumerate(pairs)) + "</div>"


def panels(*cards, cols=3, start=0, size=19):
    """cards: (glyph_name_or_svg, heading, body, colour). A grid of panels with a glyph each."""
    cells = ""
    for i, (g, k, v, c) in enumerate(cards):
        gl = g if g.lstrip().startswith("<") else glyph(g)
        cells += (f'<div class="panel"{anim(start + i, f"border-top-color:{c}")}>'
                  f'<div class="glyph" style="color:{c}">{gl}</div>'
                  f'<b>{k}</b><span style="font-size:{size}px">{v}</span></div>')
    return f'<div class="panels" style="grid-template-columns:repeat({cols},1fr)">{cells}</div>'


def ideas(*cards, cols=3, start=0):
    """cards: (label, text, colour). Smaller chips than panels."""
    cells = "".join(
        f'<div class="idea"{anim(start + i, f"border-top-color:{c}")}><b>{k}</b><span>{v}</span></div>'
        for i, (k, v, c) in enumerate(cards))
    return f'<div class="ideas" style="grid-template-columns:repeat({cols},1fr)">{cells}</div>'


def two_col(left, right, ratio="1fr 1fr"):
    return f'<div class="twocol" style="grid-template-columns:{ratio}">{left}{right}</div>'


def copy_button(key, label="Copy the prompt"):
    """A button that copies RESOURCES[key] (declared in deck.json) to the clipboard."""
    return f'<button data-copy="{key}" class="copybtn">{e(label)}</button>'


def photo(path_, size=92, border=None):
    """A round photo embedded as a data URI (jpg or png under 900 KB), or a placeholder disc."""
    import base64
    p = Path(path_)
    b = border or NEUTRAL
    if p.exists() and p.stat().st_size < 900_000:
        mime = "image/png" if p.suffix.lower() == ".png" else "image/jpeg"
        d = base64.b64encode(p.read_bytes()).decode()
        return (f'<img src="data:{mime};base64,{d}" alt="" style="width:{size}px;height:{size}px;border-radius:50%;'
                f'object-fit:cover;border:2px solid {b};display:block;margin-bottom:10px">')
    return f'<div style="width:{size}px;height:{size}px;border-radius:50%;background:{PANEL};border:2px solid {b};margin-bottom:10px"></div>'


# ---------------------------------------------------------------- glyphs (24x24, stroke, currentColor)
_G = {
    "eye": '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "blocks": '<rect x="3" y="4" width="4" height="4" rx="1"/><rect x="10" y="4" width="4" height="4" rx="1"/><rect x="17" y="4" width="4" height="4" rx="1"/><rect x="3" y="11" width="4" height="4" rx="1"/><rect x="10" y="11" width="4" height="4" rx="1"/><rect x="17" y="11" width="4" height="4" rx="1"/><rect x="3" y="18" width="4" height="4" rx="1"/><rect x="10" y="18" width="4" height="4" rx="1"/><rect x="17" y="18" width="4" height="4" rx="1"/>',
    "card": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/>',
    "person": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    "people": '<circle cx="8" cy="8" r="3.2"/><circle cx="16.5" cy="9" r="2.6"/><path d="M2.5 20c0-3.5 2.6-6 5.5-6s5.5 2.5 5.5 6M13.5 19.5c.3-2.6 1.6-4.5 3.5-4.5s3.2 1.9 3.5 4.5"/>',
    "file": '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h7"/>',
    "folder": '<path d="M3 6h6l2 2h10v12H3z"/><path d="M3 10h18"/>',
    "chat": '<path d="M4 5h16v11H9l-5 4z"/>',
    "plug": '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v4a6 6 0 0 1-12 0z"/><path d="M12 18v3"/>',
    "book": '<path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z"/>',
    "brain": '<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3 3 3 0 0 0 2 3v1a3 3 0 0 0 3 3h1V4z"/><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 3 3 3 0 0 1-2 3v1a3 3 0 0 1-3 3h-1V4z"/><path d="M12 4v16"/>',
    "hand": '<path d="M8 12V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-12 0v-3a1.5 1.5 0 0 1 3 0"/>',
    "loop": '<path d="M4 12a8 8 0 0 1 14-5.3"/><path d="M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    "bins": '<path d="M3 8h5v12H3zM9.5 8h5v12h-5zM16 8h5v12h-5z"/><path d="M5 4h14"/>',
    "cut": '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5L20 19M8.5 16.5L20 5"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "screen": '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    "mic": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    "steps": '<path d="M4 20h5v-5h5v-5h5V5"/>',
    "question": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7"/><path d="M12 17h.01"/>',
    "check": '<path d="M4 12l5 5L20 6"/>',
    "shirt": '<path d="M8 4l4 2 4-2 4 3-2 3-2-1v11H8V9L6 10 4 7z"/>',
    "key": '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M15 12v2"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    "star": '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
    "bolt": '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    "gear": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    "target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
}


def glyph(name, size=38):
    """An inline glyph for HTML (panels, chips). Colour comes from the surrounding text colour."""
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" '
            f'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{_G[name]}</svg>')


def glyph_svg(name, x, y, size=28, color=None, extra=""):
    """The same glyph placed inside a bigger SVG. Wrap in a <g> yourself if you animate it."""
    return (f'<g transform="translate({x},{y}) scale({size / 24:.3f})" fill="none" stroke="{color or INK}" '
            f'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"{extra}>{_G[name]}</g>')


GLYPHS = sorted(_G)

# ---------------------------------------------------------------- svg helpers
_svg_n = [0]


def svg(vb, body, label, top="1%"):
    """Wrap a diagram in a responsive SVG. Use vb '0 0 1100 420' at most with a header and a caption."""
    _svg_n[0] += 1
    return (f'<div style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;margin-top:{top}">'
            f'<svg viewBox="{vb}" style="width:100%;height:auto;max-height:100%;display:block;overflow:visible" '
            f'role="img" aria-label="{e(label)}">{body}</svg></div>')


def txt(x, y, s, size=16, fill=None, font=None, weight=None, anchor=None, ls=None, extra=""):
    a = f' text-anchor="{anchor}"' if anchor else ""
    w = f' font-weight="{weight}"' if weight else ""
    l = f' letter-spacing="{ls}"' if ls else ""
    return (f'<text x="{x}" y="{y}" font-family="{font or DISPLAY}" font-size="{size}" '
            f'fill="{fill or INK}"{a}{w}{l}{extra}>{e(s)}</text>')


def box(x, y, w, h, fill=None, stroke=None, sw=1.5, rx=12, dash="", extra=""):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill or WHITE}" '
            f'stroke="{stroke or RULE}" stroke-width="{sw}"{d}{extra}/>')


def _head(x, y, ang, color, at):
    a = anim(at + 0.9) if at is not None else ""
    return f'<g transform="translate({x:.1f},{y:.1f}) rotate({ang:.1f})"><path d="M-9,-4.5 L0,0 L-9,4.5 z" fill="{color}"{a}/></g>'


def arrow(x1, y1, x2, y2, color=None, dashed=False, width=2.5, extra="", at=None):
    """A straight arrow. With at=i the shaft draws in at i and the head fades in as it lands."""
    color = color or WARM
    d = ' stroke-dasharray="6 5"' if dashed else ""
    ang = math.degrees(math.atan2(y2 - y1, x2 - x1))
    L = math.hypot(x2 - x1, y2 - y1) or 1
    k = max(0.0, (L - 6) / L)
    ex, ey = x1 + (x2 - x1) * k, y1 + (y2 - y1) * k
    dr = draw(at) if at is not None else ""
    return (f'<g{extra}><path d="M{x1},{y1} L{ex:.1f},{ey:.1f}" fill="none" stroke="{color}" stroke-width="{width}"{d}{dr}/>'
            + _head(x2, y2, ang, color, at) + "</g>")


def curve(d_, end, color=None, dashed=False, width=2.5, extra="", at=None):
    """A curved arrow from an SVG path string; end=(x, y, angle_deg) places the head."""
    color = color or WARM
    d = ' stroke-dasharray="6 5"' if dashed else ""
    dr = draw(at) if at is not None else ""
    x, y, ang = end
    return f'<g{extra}><path d="{d_}" fill="none" stroke="{color}" stroke-width="{width}"{d}{dr}/>{_head(x, y, ang, color, at)}</g>'


def fchip(x, y, name, color=None, w=None, extra=""):
    """A file chip: a small page icon and a mono name."""
    color = color or WARM
    w = w or int(len(name) * 8.2 + 40)
    icon = (f'<path d="M{x + 11},{y + 7} H{x + 20} L{x + 24},{y + 11} V{y + 22} H{x + 11} Z" fill="{WHITE}" stroke="{color}" stroke-width="1.5" stroke-linejoin="round"/>'
            f'<path d="M{x + 20},{y + 7} V{y + 11} H{x + 24}" fill="none" stroke="{color}" stroke-width="1.5"/>')
    return (f'<g{extra}><rect x="{x}" y="{y}" width="{w}" height="30" rx="7" fill="{WHITE}" stroke="{color}" stroke-width="1.5"/>'
            + icon + txt(x + 31, y + 20, name, 13, INK, MONO) + "</g>")


def chip(x, y, label, color=None, fill=None, w=None, extra=""):
    """A labelled pill."""
    color = color or NEUTRAL
    w = w or int(len(label) * 8.6 + 28)
    return (f'<g{extra}><rect x="{x}" y="{y}" width="{w}" height="30" rx="15" fill="{fill or WHITE}" stroke="{color}" stroke-width="1.5"/>'
            + txt(x + w / 2, y + 20, label, 14, INK, DISPLAY, anchor="middle") + "</g>")


def badge(n, x, y, color=None, r=14, fg=None):
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color or INK}"/>'
            + txt(x, y + 5, str(n), 14, fg or CARD, MONO, anchor="middle"))


def wrap(s, width):
    """Greedy wrap for SVG text: lines no longer than width characters."""
    words, lines, cur = s.split(" "), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > width and cur:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur:
        lines.append(cur)
    return lines


def tlines(x, y, s, width, size=15, fill=None, lh=None, font=None, weight=None, anchor=None):
    lh = lh or int(size * 1.4)
    return "".join(txt(x, y + i * lh, ln, size, fill, font, weight, anchor) for i, ln in enumerate(wrap(s, width)))


def fits(s, width_px, size, mono=False):
    """Rough check that a string fits a width at a font size (0.55 em per char display, 0.6 mono)."""
    return len(s) * size * (0.6 if mono else 0.55) <= width_px


# ---------------------------------------------------------------- the cast: one set of figures for a whole deck
def figure(x, y, color=None, lean=0, size=56, extra=""):
    """A person: circle head and a simple body, feet at (x, y). lean rotates about the feet (+ leans right).
    Wrap in <g{anim(i)}> to animate; do not put anim on this element."""
    color = color or HIGHLIGHT
    s = size / 56
    return (f'<g transform="translate({x},{y}) rotate({lean}) scale({s:.3f})" fill="none" stroke="{color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"{extra}>'
            f'<circle cx="0" cy="-46" r="8" fill="{color}" stroke="none"/>'
            f'<path d="M0,-36 V-12 M0,-12 L-10,0 M0,-12 L10,0 M-12,-30 L0,-32 L12,-30"/></g>')


def machine(x, y, w=110, h=80, color=None, concave=0, extra=""):
    """The system: a rounded block with an eye. concave > 0 bends its left side inward (toward a person)."""
    color = color or COOL
    r = 12
    if concave:
        d = (f'M{x + r},{y} H{x + w - r} Q{x + w},{y} {x + w},{y + r} V{y + h - r} Q{x + w},{y + h} {x + w - r},{y + h} '
             f'H{x + r} Q{x},{y + h} {x},{y + h - r} Q{x + concave},{y + h / 2} {x},{y + r} Q{x},{y} {x + r},{y} Z')
        body = f'<path d="{d}" fill="{color}"/>'
    else:
        body = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{color}"/>'
    return f'<g{extra}>{body}{glyph_svg("eye", x + w / 2 - 14, y + h / 2 - 14, 28, CARD)}</g>'


def rigid(x, y, w=110, h=80, color=None, extra=""):
    """What is written down, or the old product: a square-cornered box."""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color or WARM}"{extra}/>'


# ---------------------------------------------------------------- common pictures
def strip(n, lit, x=20, y=20, w=1060, labels=None, at=0):
    """A row of n blocks with some lit (dict index->colour). labels: dict index->text under the block."""
    o = []
    gap = 8
    bw = (w - gap * (n - 1)) / n
    labels = labels or {}
    for i in range(n):
        bx = x + i * (bw + gap)
        col = lit.get(i)
        fill = col if col else NEUTRAL
        o.append(f'<rect x="{bx:.1f}" y="{y}" width="{bw:.1f}" height="34" rx="6" fill="{fill}"{anim(at if not col else at + 1)}/>')
        o.append(txt(bx + bw / 2, y + 23, str(i + 1), 14, INK if not col else CARD, MONO, anchor="middle", extra=anim(at if not col else at + 1)))
        if i in labels:
            o.append(txt(bx + bw / 2, y + 54, labels[i], 12, MUTED, MONO, anchor="middle", extra=anim(at + 1)))
    return "".join(o)


def timeline_bar(segments, total=None, y=70, h=64, x=20, w=1060, at=0):
    """segments: (minutes, label, sublabel, colour, text_colour). Bars grow in left to right."""
    total = total or sum(s[0] for s in segments)
    scale = w / total
    o = []
    t = 0
    cx = x
    for k, (m, lab, sub, col, tc) in enumerate(segments):
        sw = m * scale
        d = at + k * 0.45
        o.append(f'<rect x="{cx:.1f}" y="{y}" width="{sw - 3:.1f}" height="{h}" rx="6" fill="{col}"{grow(d)}/>')
        if sw >= 80 and lab:
            o.append(txt(cx + 8, y + 27, lab, 15, tc, DISPLAY, weight="700", extra=anim(d + 0.5)))
            o.append(txt(cx + 8, y + 50, f"{m} min", 13, tc, MONO, extra=anim(d + 0.5)))
        elif lab:
            o.append(txt(cx + 2, y + h + 24, f"{lab} · {m} min", 13, INK, DISPLAY, weight="700", extra=anim(d + 0.5)))
        if m >= 8:
            hh, mm = divmod(t, 60)
            o.append(txt(cx, y - 12, f"{hh}:{mm:02d}" if hh else f":{mm:02d}", 13, MUTED, MONO, extra=anim(d)))
        if sub:
            o.append(txt(cx + (2 if sw < 80 else 10), y + h + 46, sub, 13, MUTED, DISPLAY, extra=anim(d + 0.5)))
        cx += sw
        t += m
    hh, mm = divmod(t, 60)
    o.append(txt(x + w - 4, y - 12, f"{hh}:{mm:02d}", 13, MUTED, MONO, anchor="end"))
    return "".join(o)


def legend(items, x=20, y=226, at=0):
    """items: (colour, label). A horizontal legend."""
    o = []
    lx = x
    for c, l in items:
        o.append(f'<rect x="{lx}" y="{y - 14}" width="18" height="18" rx="4" fill="{c}"{anim(at)}/>')
        o.append(txt(lx + 28, y, l, 15, MUTED, extra=anim(at)))
        lx += 30 + len(l) * 8.6
    return "".join(o)
