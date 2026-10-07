# -*- coding: utf-8 -*-
"""Render every screen of a built deck to PNG at 1280x720, plus 2x2 contact sheets.

    python scripts/render.py path/to/deck/out/Deck.html [3 5 27]

Uses a headless Chromium. Set DECK_CHROME to the browser executable, or let this script look in the
usual places (Playwright's chromium, Google Chrome, Microsoft Edge). Screens are rendered in static
mode (?static=1) so every animated element is at its final state; that is what you want for checking
overflow and legibility.
"""
import glob, os, re, subprocess, sys
from pathlib import Path


def find_chrome():
    c = os.environ.get("DECK_CHROME")
    if c and Path(c).exists():
        return c
    home = Path.home()
    cands = []
    cands += glob.glob(str(home / "AppData/Local/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-win64/chrome-headless-shell.exe"))
    cands += glob.glob(str(home / "AppData/Local/ms-playwright/chromium-*/chrome-win/chrome.exe"))
    cands += glob.glob(str(home / "Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac*/chrome-headless-shell"))
    cands += glob.glob(str(home / ".cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell"))
    cands += ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
              "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]
    for c in cands:
        if Path(c).exists():
            return c
    raise SystemExit("No Chromium found. Set DECK_CHROME to a chrome/chromium executable, or `pip install playwright && playwright install chromium`.")


deck = Path(sys.argv[1]).resolve()
wanted = [int(a) for a in sys.argv[2:]]
shots = deck.parent / f"shots-{deck.stem}"
shots.mkdir(parents=True, exist_ok=True)
n = len(re.findall(r'<section class="slide', deck.read_text(encoding="utf-8")))
wanted = wanted or list(range(1, n + 1))
chrome = find_chrome()
url = "file:///" + str(deck).replace("\\", "/").replace(" ", "%20")
for k in wanted:
    png = shots / f"s{k:02d}.png"
    subprocess.run([chrome, "--headless", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,720", "--virtual-time-budget=6000",
                    f"--screenshot={png}", f"{url}?static=1#slide-{k}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    print("rendered", png.name)
try:
    from PIL import Image
    files = sorted(shots.glob("s[0-9][0-9].png"))
    for i in range(0, len(files), 4):
        sheet = Image.new("RGB", (1280, 720), "white")
        for j, f in enumerate(files[i:i + 4]):
            im = Image.open(f).convert("RGB").resize((640, 360))
            sheet.paste(im, ((j % 2) * 640, (j // 2) * 360))
        sheet.save(shots / f"sheet{i // 4 + 1:02d}.png")
    print(f"sheets: {(len(files) + 3) // 4} in {shots}")
except ImportError:
    print("Pillow not installed; no contact sheets (pip install pillow)")
print("screens:", n)
