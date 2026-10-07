# Writing for the screen and the notes

The deck is a lecture aid, not the lecture. A screen states something; the speaker explains it. These rules keep the screens clean and the notes rich.

## The load rule

Every content screen has one claim as its header, one picture, and at most one caption under the picture. A footnote is allowed only for a verified quotation. Cues (a short instruction to the room) belong on exercise and logistics screens. Everything else you want to say goes into the notes, word for word, so nothing is lost.

If a screen needs two captions, it is two screens or one better picture.

## Register

- Open on the claim. State it once, as a full sentence, in sentence case.
- Explain rather than perform. No reveal lines (a claim followed by a short fragment that lands it), no "not X but Y" or "X rather than Y" beyond one in the whole deck, no fragments that land a point, no forced triads, no dashes of any kind, no staged run-ups ("here's the thing", "let's dive in").
- No stock AI words: crucial, pivotal, robust, delve, landscape, journey, unlock, leverage, seamless, empower, testament, showcase, vibrant, elevate, harness.
- Headers are claims. "Every file you have built is one of three parts" is a header. "The three parts" is a label.
- Quotations must be verified wording, with the source named on screen. Paraphrase outside quotation marks.
- Method vocabulary stays off learner screens. Draw the real thing (a chat, a file, a folder, a connection) instead of naming the method.
- Examples come one per audience segment, always in the same order, and the notes name each segment's version aloud.

## Notes

`notes(say, do, look, stuck, bridge, ahead)`:

- **SAY** is what the speaker says, first person, full sentences, in the speaker's voice. This is where the depth lives.
- **DO NOW** is what to click, share, open, or hand over, with times where a host has to act ("open rooms at :18, broadcast at :30, close at :33").
- **LOOK FOR** is what the room should be doing if the screen is working, and the sign it is not.
- **IF STUCK** is the recovery: the reply to type, the fallback if a platform fails, the question to ask a stalled table.
- **IF THE ROOM IS AHEAD** is the deeper version for an audience that already knows the basic one. The screen stays the same; the speaker chooses live.
- **BRIDGE** is the exact last sentence before the next screen. Write the bridges as a chain and read them in order: if one does not lead to the next header, the order is wrong.

## Checking

`scripts/check_text.py` reads the built deck and flags dashes, staged openers, method words, live colour outside the mode dot, contrast constructions beyond the allowance, stock words, and possible fragments. Run it with `--dump` and read every screen's text and notes flat, as if said in a seminar. Anything that sounds like it is performing gets restated as plain explanation.
