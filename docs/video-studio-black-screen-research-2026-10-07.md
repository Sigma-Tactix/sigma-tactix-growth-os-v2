# Video Studio black-screen investigation — 2026-10-07

## Scope

Investigate the authenticated `/video-studio` black screen, verify whether the
surface creates real video artifacts, and align it with the governed
HyperFrames renderer.

## Primary evidence

- The active signed-in Chrome tab reproduced a completely blank application
  root at `http://localhost:3000/video-studio`, including after a hard reload.
- A clean browser session reached the authentication shell, proving that the
  application bundle could boot and narrowing the failure to the authenticated
  lazy-loaded route.
- `VideoStudioPage.tsx` initialized `scenes` from `DEFAULT_SCENES`.
  `DEFAULT_SCENES` is empty unless `VITE_SEED_DEMO_WORKSPACE` is enabled, but
  the component unconditionally read `activeScene.timeCode`. Server rendering
  reproduced the exact exception: `Cannot read properties of undefined
  (reading 'timeCode')`.
- The prior page did not import Remotion or invoke a renderer. Its Generate
  action used `setTimeout`, inserted predetermined scenes, and recorded a
  `SUCCESS` run. The Remotion package is not declared in `package.json`.
- HyperFrames describes itself as an open-source framework that turns HTML,
  CSS, media, and seekable animation into deterministic MP4 video. Its official
  repository documents the local CLI render workflow:
  <https://github.com/heygen-com/hyperframes>.

## Decision

1. Keep demo-only storyboard fixtures out of normal workspaces.
2. Render an explicit empty state when no storyboard evidence exists.
3. Replace timer-driven Remotion claims with the existing governed
   HyperFrames task flow.
4. Show the composition mockup as `LAYOUT PREVIEW / NOT YET RENDERED`.
5. Expose playback/download only after the task is approved, reaches `Success`,
   and contains a deterministic MP4 artifact receipt.

## Verification

- Regression test first reproduced the exact crash, then passed after the fix.
- TypeScript validation passed.
- The same signed-in Chrome tab rendered the repaired Video Studio.
- Browser submission created task
  `task-947c7a8b-2c0a-4ee2-b3b5-38d71868a60a` with visible status
  `Pending Approval`; no renderer executed before approval.
- The task was approved through Agent Cockpit and reached `Success`. The local
  artifact is an H.264 MP4, 1080x1920, exactly 8 seconds, 770 KB.
- A direct `<video src="/api/workspace/...">` failed because native media
  requests do not carry the app's bearer token. Playback now fetches the file
  through `apiFetch`, creates a short-lived `blob:` URL, and revokes it during
  cleanup. Chrome playback and visible motion were verified at 00:01/00:08.

## Remaining boundary

HyperFrames is deterministic composition/rendering, not generative source
footage. Multi-scene AI footage remains unavailable until a verified footage
provider is integrated. Production deployment must also provide FFmpeg,
Chromium, and durable artifact storage.
