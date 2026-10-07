# The build loop

Four steps, in this order, every time. Skipping the first is how decks end up as lists.

## 1. Storyboard

Copy `reference/storyboard-template.md` into the deck folder as `storyboard.md` and fill it. The room, the goal, the argument as numbered claims, the run of show with modes, then one entry per screen: header, time band, mode, picture with its build order, caption, and what the notes carry.

Read it back once as prose. The headers alone should make the argument. The bridges alone should make the argument. If either does not, fix the storyboard, not the screens.

For a long deck, have someone (or another agent) critique the storyboard before building: flow, audience level, whether each picture shows the mechanism of its claim, and coverage of the brief. Twenty minutes here saves an hour of rebuilding.

## 2. Screens

`python scripts/new_deck.py path/to/deck --title "…" --theme eduba --left "PROGRAMME" --right "SESSION 1"` scaffolds `deck.json`, `storyboard.md` and `screens.py`.

Write screens in `screens.py` (or several modules listed in `deck.json`, so several people can build in parallel). Each is `slide(title, time, content, foot, notes)`. Content starts with the mode strip, then the header, then the picture or panel grid, then the caption. See `reference/kit-api.md` for every helper and `examples/demo/screens.py` for nine worked screens.

Rules that keep screens clean:

- Diagrams in `svg()` with a viewBox no bigger than `0 0 1100 420` when there is a header and a caption. Smallest text in a diagram is 13px. Text must fit its box: about 0.55 em per character for the display face, 0.6 for mono; use `wrap`/`tlines`. Nothing past x=1080.
- Every element gets an animation attribute with a delay in speaking order. Fractional delays are fine; the largest on a screen is 6, so everything lands within three seconds.
- Role colours by meaning (see `reference/themes.md`). The live colour belongs only to the mode dot.
- One cast: `figure`, `machine`, `rigid` for every person, system and rigid box, so the audience meets the same drawings all deck.

## 3. Build and render

```
python scripts/build_deck.py path/to/deck
python scripts/render.py path/to/deck/out/Deck.html
```

The renderer needs a Chromium (`DECK_CHROME`, or Playwright's, Chrome or Edge in the usual places). It writes one PNG per screen in static mode, all animation at its final state, plus 2×2 contact sheets. Look at every sheet. Overflow, clipped labels and missing arrowheads only show at real size.

To preview a theme without changing the deck: `python scripts/build_deck.py path/to/deck --theme slate` writes a second file next to the first.

## 4. Check and fix

```
python scripts/check_text.py path/to/deck/out/Deck.html --dump
```

Fix hard failures (dashes, staged openers, method words, missing mode strip, live colour in a diagram, too many contrasts). Read the dump flat. Then re-render the screens you changed and look again. Stop when a full render has nothing to fix.

## Presenting

Open the HTML in a browser. Arrow keys move, N opens the notes panel, O the overview, B blackout, F fullscreen. Print gives one page per screen for the handout. Copy buttons put the deck's resources on the clipboard for the room. Animations replay each time a screen is entered; `?static=1` in the URL shows everything at once.
