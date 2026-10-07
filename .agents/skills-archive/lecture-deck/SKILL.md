---
name: lecture-deck
description: Build a high-quality animated HTML lecture or workshop deck from a storyboard, in any theme. Use whenever someone asks for a slide deck, session deck, workshop slides, lecture screens, a run-of-show deck, or speaker notes for a talk, especially one delivered live (in a room or on Zoom) with breakouts, share-screen moments and handoffs. Produces one self-contained HTML file with keyboard navigation, speaker notes, overview, print, copy-to-clipboard prompts and a mode strip on every screen, plus PNG renders for checking. Ships with three themes and a kit for diagrams, animation, a recurring cast of figures, and a register checker. Not for pitch decks that must be PowerPoint, or for data dashboards.
---

# Lecture deck

One claim per screen, one picture that shows the mechanism, one caption, and everything else in the notes. The deck is built from Python screen modules against a theme, rendered to PNG for checking, and checked for register before it leaves.

## When you get a request

1. Ask for or infer the room: who, how many, where, how long, what they already know, who speaks and who runs the room. If a run of show exists (a host's timings), take it as given.
2. Write `storyboard.md` first, using `reference/storyboard-template.md`. Goal, argument as numbered claims, run of show with modes, then one entry per screen with its picture and its bridge. Read the headers alone as an argument; then the bridges alone. Fix order here.
3. For anything over ten screens, critique the storyboard before building (flow, audience level, whether each picture explains its claim, coverage of the brief). Fold the changes in.
4. Scaffold and build the screens (`reference/workflow.md`, `reference/kit-api.md`). For a long deck split screens into modules and build them in parallel.
5. Render every screen and look at every contact sheet. Fix overflow, clipping, unreadable text, pictures that decorate instead of explain.
6. Run the register check with `--dump` and read the text flat. Fix, re-render what changed, repeat until clean.
7. Deliver the HTML, name what is placeholder (dates, names, a platform that may not be ready), and say how to present it (arrows, N, O, B, F, Print).

## The rules that make it good

- **The load rule.** Header is the claim. One picture. At most one caption. Footnotes only for verified quotations. Cues only on exercise and logistics screens. Depth goes into SAY and IF THE ROOM IS AHEAD, word for word.
- **Pictures show mechanisms.** A picture that could sit under any header is decoration. Draw the actual thing: the chat, the file, the folder, the person bending, the bins filling. Build it up in the order the speaker will talk, with `anim`, `draw`, `grow`, `rise`, `slide_in`, `drop`. Complex is fine when it explains.
- **One cast.** Use `figure`, `machine`, `rigid` for every person, system and rigid box so the audience meets the same drawings all deck.
- **Roles, not colours.** `HIGHLIGHT` is the subject and now; `COOL` the system; `WARM` what is written; `SOFT` the other party; `NEUTRAL` gaps; `LIVE` only the mode dot. Any theme then works.
- **The mode strip.** Every screen starts with `mode(kind, label, who)`: slides, share, breakout, solo, handoff, break. The audience always knows who has the screen; the speaker always knows when to swap apps or hand over. The run-of-show bar uses the same colours.
- **Register.** Open on the claim, full sentences, explain rather than perform. No reveal lines, no "not X but Y" beyond one per deck, no fragments that land a point, no forced triads, no dashes, no stock AI words, no method vocabulary on audience screens. Verified quotations only. Examples one per audience segment, same order every time. Details in `reference/writing.md`.
- **Notes are the lecture.** SAY in the speaker's voice, DO NOW with times for the host, LOOK FOR, IF STUCK, IF THE ROOM IS AHEAD, and a BRIDGE that leads into the next header.
- **Check at real size.** The renderer's static mode shows every animated element at its final state. Faults invisible in a browser pane show at 1280×720.

## Commands

```
python scripts/new_deck.py path/to/deck --title "Session one" --theme eduba --left "PROGRAMME" --right "SESSION 1"
python scripts/build_deck.py path/to/deck            # writes deck/out/<name>.html
python scripts/build_deck.py path/to/deck --theme slate   # a second file in another theme
python scripts/render.py path/to/deck/out/<name>.html     # PNG per screen + contact sheets, static mode
python scripts/check_text.py path/to/deck/out/<name>.html --dump
```

Requirements: Python 3.9+, a Chromium for rendering (Playwright's, Chrome or Edge; or set `DECK_CHROME`), Pillow for contact sheets. Fonts load from Google Fonts at open time; the theme carries a fallback stack.

## Files

- `scripts/deckkit/kit.py` the helpers, constants, cast, common pictures. `scripts/deckkit/shell.py` the page shell. `scripts/deckkit/themes/*.json` the themes.
- `reference/workflow.md` the loop · `reference/writing.md` the register · `reference/kit-api.md` every helper · `reference/themes.md` roles and how to make a theme · `reference/storyboard-template.md`.
- `examples/demo/` a nine-screen deck that exercises most of the kit; build it in each theme to see the range.
