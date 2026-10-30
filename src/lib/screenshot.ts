import { chromium } from "playwright";
import type { SupabaseClient } from "@supabase/supabase-js";
import { inspectArtifactBytes } from "./artifactInspection";

// Real screenshot capture for the UI/UX Audit Lab — replaces the hardcoded
// Unsplash stock photos that findings cards used to show regardless of what
// URL was actually audited.
//
// These used to be returned as base64 JPEG data URIs and persisted straight
// into the workspace_state jsonb blob. Three captures — one of them a full-page
// shot of an arbitrary client site — is easily megabytes of base64, and EVERY
// one of the ~90 API routes reads and rewrites that entire blob on every
// request (loadWorkspace/saveWorkspace do a whole-document SELECT and upsert).
// One audit therefore made every subsequent request in the workspace slower,
// permanently. They now go to the private `vault-files` Storage bucket that
// already exists for uploads, and only a URL string is persisted.

export interface AuditScreenshots {
  desktop: string | null;
  mobile: string | null;
  fullPage: string | null;
}

/** The two renderings a proposed landing artifact must retain before approval. */
export interface LandingArtifactPreviews {
  desktop: string | null;
  mobile: string | null;
}

interface CapturedBuffers {
  desktop: Buffer | null;
  mobile: Buffer | null;
  fullPage: Buffer | null;
}

interface LandingArtifactPreviewBuffers {
  desktop: Buffer | null;
  mobile: Buffer | null;
}

// Bounded concurrency. Each Chromium instance is roughly 400 MB resident, and
// this route is reachable by any authenticated member with no rate limit, so an
// unbounded launch-per-request is a trivial way to OOM the box — which takes
// down the single shared Node process serving every tenant, not just the audit.
// One at a time, a short queue, and anything beyond that is told to retry.
const MAX_CONCURRENT_BROWSERS = 1;
const MAX_QUEUE_DEPTH = 3;
let activeBrowsers = 0;
let queuedRequests = 0;

export class ScreenshotCapacityError extends Error {
  constructor() {
    super("Screenshot capture is busy. Please retry in a moment.");
    this.name = "ScreenshotCapacityError";
  }
}

async function withBrowserSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (activeBrowsers >= MAX_CONCURRENT_BROWSERS && queuedRequests >= MAX_QUEUE_DEPTH) {
    throw new ScreenshotCapacityError();
  }
  queuedRequests++;
  try {
    while (activeBrowsers >= MAX_CONCURRENT_BROWSERS) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    queuedRequests--;
    activeBrowsers++;
    try {
      return await fn();
    } finally {
      activeBrowsers--;
    }
  } catch (err) {
    if (queuedRequests > 0 && !(err instanceof ScreenshotCapacityError)) queuedRequests--;
    throw err;
  }
}

// Raw capture with no persistence, for offline tooling that has no Supabase
// client (scripts/dogfood-sigmatactix.ts). Production code must use
// captureAndStoreAuditScreenshots instead — returning image bytes to a caller
// that then persists them is how the base64-in-jsonb problem started.
export async function captureAuditScreenshotBuffers(url: string, timeoutMs = 20000): Promise<CapturedBuffers> {
  return withBrowserSlot(() => captureBuffers(url, timeoutMs));
}

async function captureBuffers(url: string, timeoutMs: number): Promise<CapturedBuffers> {
  const browser = await chromium.launch({ headless: true });
  try {
    const result: CapturedBuffers = { desktop: null, mobile: null, fullPage: null };

    const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    try {
      const page = await desktopCtx.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });
      result.desktop = await page.screenshot({ type: "jpeg", quality: 65 });
      result.fullPage = await page.screenshot({ type: "jpeg", quality: 55, fullPage: true });
    } finally {
      await desktopCtx.close();
    }

    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      const page = await mobileCtx.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });
      result.mobile = await page.screenshot({ type: "jpeg", quality: 65 });
    } finally {
      await mobileCtx.close();
    }

    return result;
  } finally {
    await browser.close();
  }
}

/**
 * Render generated, trusted proposal HTML at the same desktop/mobile sizes
 * used for source capture. This is intentionally separate from URL capture:
 * a preview is proof that the stored artifact rendered, not a screenshot of
 * an arbitrary remote page.
 */
async function renderLandingArtifactBuffers(html: string, timeoutMs: number): Promise<LandingArtifactPreviewBuffers> {
  return withBrowserSlot(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const result: LandingArtifactPreviewBuffers = { desktop: null, mobile: null };
      const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      try {
        const page = await desktopCtx.newPage();
        await page.setContent(html, { waitUntil: "networkidle", timeout: timeoutMs });
        result.desktop = await page.screenshot({ type: "jpeg", quality: 75, fullPage: true });
      } finally {
        await desktopCtx.close();
      }
      const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      try {
        const page = await mobileCtx.newPage();
        await page.setContent(html, { waitUntil: "networkidle", timeout: timeoutMs });
        result.mobile = await page.screenshot({ type: "jpeg", quality: 75, fullPage: true });
      } finally {
        await mobileCtx.close();
      }
      return result;
    } finally {
      await browser.close();
    }
  });
}

// Signed-URL lifetime. Long, because the URL is persisted alongside the audit
// and the audit is a durable record the client revisits; re-running the audit
// regenerates all three. The tradeoff is deliberate and low-stakes: a leaked
// URL exposes a screenshot of the client's own PUBLIC website for this window,
// not any vault content. Anything sensitive must not go through this path.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365;

// Captures, uploads to the private vault-files bucket under the caller's own
// workspace prefix, and returns signed URLs. The `{workspace_id}/...` path
// convention is what the bucket's vault_files_rw policy checks against
// workspace_members, so these objects inherit the same tenant boundary as
// every other upload.
//
// Falls back to returning nulls rather than throwing on an upload failure: a
// text-only audit is a degraded result, not a failed one. A capacity rejection
// DOES propagate, so the caller can report it honestly.
export async function captureAndStoreAuditScreenshots(
  sb: SupabaseClient,
  workspaceId: string,
  url: string,
  timeoutMs = 20000,
): Promise<AuditScreenshots> {
  const buffers = await withBrowserSlot(() => captureBuffers(url, timeoutMs));
  const stamp = Date.now();
  const result: AuditScreenshots = { desktop: null, mobile: null, fullPage: null };

  for (const kind of ["desktop", "mobile", "fullPage"] as const) {
    const buf = buffers[kind];
    if (!buf) continue;
    if (!inspectArtifactBytes({ kind: "jpeg-preview", bytes: buf }).valid) {
      console.error(`Refusing invalid ${kind} audit screenshot bytes.`);
      continue;
    }
    const path = `${workspaceId}/uiux-audits/${stamp}-${kind}.jpg`;
    try {
      const { error: uploadErr } = await sb.storage
        .from("vault-files")
        .upload(path, buf, { contentType: "image/jpeg", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data, error: signErr } = await sb.storage
        .from("vault-files")
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      if (signErr) throw signErr;
      result[kind] = data?.signedUrl ?? null;
    } catch (err) {
      console.error(`Failed to store ${kind} audit screenshot:`, err);
    }
  }

  return result;
}

/**
 * Persist previews for a generated landing-page artifact. Preview persistence
 * is part of artifact creation: if either rendition cannot be stored, callers
 * receive null and the artifact contract refuses approval.
 */
export async function renderAndStoreLandingArtifactPreviews(
  sb: SupabaseClient,
  workspaceId: string,
  artifactId: string,
  html: string,
  timeoutMs = 20000,
): Promise<LandingArtifactPreviews> {
  const buffers = await renderLandingArtifactBuffers(html, timeoutMs);
  const result: LandingArtifactPreviews = { desktop: null, mobile: null };
  for (const kind of ["desktop", "mobile"] as const) {
    const buffer = buffers[kind];
    if (!buffer) continue;
    if (!inspectArtifactBytes({ kind: "jpeg-preview", bytes: buffer }).valid) {
      console.error(`Refusing invalid proposed ${kind} landing preview bytes.`);
      continue;
    }
    const storagePath = `${workspaceId}/landing-artifacts/${artifactId}/proposed-${kind}.jpg`;
    try {
      const { error: uploadError } = await sb.storage
        .from("vault-files")
        .upload(storagePath, buffer, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const { data, error: signError } = await sb.storage
        .from("vault-files")
        .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
      if (signError) throw signError;
      result[kind] = data?.signedUrl ?? null;
    } catch (error) {
      console.error(`Failed to persist proposed ${kind} landing preview:`, error);
    }
  }
  return result;
}
