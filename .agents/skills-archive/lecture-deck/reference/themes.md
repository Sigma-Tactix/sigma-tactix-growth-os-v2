# Themes

A theme is one JSON file in `scripts/deckkit/themes/`. Screens never name a colour; they name a role, so any deck renders in any theme.

## Roles

| Constant | Meaning in a deck | Typical use |
|---|---|---|
| `HIGHLIGHT` | the subject, "you", now, the thing to look at first | the lit block, the person, the bar that matters |
| `COOL` | the system, the machine, anything automatic | the model, a platform, a connection |
| `WARM` | what is written down, human artefacts | files, rules, the old product |
| `SOFT` | the other party | the customer, the partner, the reader |
| `NEUTRAL` | chips, gaps, not yet | unlit blocks, dashed outlines, gap weeks |
| `LIVE` | the live dot in the mode strip | nothing else, ever |
| `INK`, `MUTED`, `RULE` | text, secondary text, hairlines | |
| `BG`, `CARD`, `PANEL` | the page, the card, panels on the card | |
| `*_BG` | tinted fills behind text for each role | `HIGHLIGHT_BG`, `COOL_BG`, `WARM_BG`, `SOFT_BG` |

Arrows follow the same map: an arrow meaning "you" is `HIGHLIGHT`, "the machine does this" is `COOL`, "this is written" is `WARM`.

## Mode strip

The strip at the top of every screen names what is happening and who has the screen. Six kinds: `slides`, `share`, `breakout`, `solo`, `handoff`, `break`. The theme maps each to a dot colour. Use the same kinds in the run-of-show bar so the bar and the strips agree.

## Shipped themes

- **eduba**: wine page, cream card, gold highlight, petrol cool, brown warm, sage soft. Warm and editorial.
- **slate**: dark slate page, cool white card, amber highlight, teal cool, rust warm, sage soft. Technical rooms, evening sessions.
- **paper**: flat light page (no inset card), red highlight, ink-blue cool, olive warm, green soft. Bright rooms and print.

## Making a theme

Copy a shipped file and change the values. Fields:

- `chrome`: `card` (a page colour with an inset card) or `flat` (the card fills the screen).
- `fonts.display`, `fonts.mono`: CSS font stacks with real fallbacks. `fonts.import`: a Google Fonts URL, or empty to use system fonts only.
- `colors`: every key in the table above, plus `on_bg` (chrome text on the page colour) and `rule_on_bg`.
- `modes`: the six dot colours. Usually `slides` is the ink or page colour, `share` the highlight, `breakout` the cool, `solo` the live, `handoff` the warm, `break` the neutral.

Check contrast: ink on card and on panel at 7:1 or better; each role colour readable as a 2px stroke on the card; `*_BG` tints light enough that ink text on them stays at 7:1.

Use it with `"theme": "myname"` in `deck.json`, or a path to the JSON, or `--theme myname` on the build command.
