import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { assessRuntimeReadiness } from '../runtimeReadiness.js';
import { getPublicClient } from '../../lib/supabaseAdmin.js';

// ---------------------------------------------------------------------------
// Public ops band — the unauthenticated registrations: the /healthz,
// /api/health, /readyz, /api/ready probes and the two public intake-token
// routes (/api/public/intake/:token, /:token/complete).
//
// Extracted from server.ts (P2 increment 17 of the router-extraction
// program, see docs/OPTIMIZATION_AUDIT.md). Handler bodies byte-preserved.
// Everything the band consumes co-moves (there is NO workspace-scoped state
// to inject — the factory is zero-arg):
//   - publicLimiter (60s / 20 requests) was SOLELY used by the two intake
//     routes, so its config moves here verbatim;
//   - resolveRuntimeCommitSha was SOLELY used by the three probe handlers;
//   - respondWithReadiness is the shared readiness handler.
// assessRuntimeReadiness + getPublicClient are stable lib imports; fs/path
// serve the .git/HEAD read in the commit-sha helper.
//
// Mounted at the root (full /api... paths) at the ORIGINAL position: after
// the global express.json() parser and strictly BEFORE app.use("/api",
// apiLimiter) + app.use("/api/workspace", requireAuth). That ordering is
// load-bearing and preserved: the six public routes never see the global API
// rate limiter or the workspace auth middleware — the intake routes are
// throttled by publicLimiter ONLY, and the probes are dependency-free liveness
// checks a supervisor can hit with no credentials, exactly as the inline
// registrations were.
// ---------------------------------------------------------------------------

const publicLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again shortly." },
});
export function createPublicOpsRouter(): Router {
  const router = Router();

// Liveness probe for the process supervisor and uptime monitoring. Deliberately
// registered before app.use("/api/workspace", requireAuth) and deliberately
// dependency-free: it answers "is this process alive and serving HTTP", which
// is the question a restart policy needs. It must NOT check Supabase — a DB
// blip would then cause the supervisor to kill an otherwise healthy process.
function resolveRuntimeCommitSha(): string {
  if (process.env.GIT_COMMIT_SHA) return process.env.GIT_COMMIT_SHA;
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  if (process.env.COMMIT_SHA) return process.env.COMMIT_SHA;
  try {
    const gitHeadPath = path.join(process.cwd(), '.git', 'HEAD');
    if (fs.existsSync(gitHeadPath)) {
      const head = fs.readFileSync(gitHeadPath, 'utf8').trim();
      if (head.startsWith('ref: ')) {
        const refPath = path.join(process.cwd(), '.git', head.slice(5));
        if (fs.existsSync(refPath)) {
          return fs.readFileSync(refPath, 'utf8').trim();
        }
      } else {
        return head;
      }
    }
  } catch { }
  return "be85432d0b5033878b438cf38b97587ef03b9c73";
}

// Liveness probe for the process supervisor and uptime monitoring. Deliberately
// registered before app.use("/api/workspace", requireAuth) and deliberately
// dependency-free: it answers "is this process alive and serving HTTP", which
// is the question a restart policy needs. It must NOT check Supabase — a DB
// blip would then cause the supervisor to kill an otherwise healthy process.
router.get("/healthz", (_req: Request, res: Response) => {
  res.json({
    ok: true, uptimeSeconds: Math.round(process.uptime()),
    commit: resolveRuntimeCommitSha(),
    status: "alive",
  });
});

router.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    uptimeSeconds: Math.round(process.uptime()),
    commit: resolveRuntimeCommitSha(),
    status: "alive",
  });
});

// Readiness probe: checks system environment, database presence, and exposes runtime commit
async function respondWithReadiness(_req: Request, res: Response) {
  const readiness = await assessRuntimeReadiness();
  res.status(readiness.ready ? 200 : 503).json({
    ...readiness,
    commit: resolveRuntimeCommitSha(),
    uptimeSeconds: Math.round(process.uptime()),
  });
}
router.get("/readyz", respondWithReadiness);
router.get("/api/ready", respondWithReadiness);
// Public, UNAUTHENTICATED routes — the client-facing intake completion form
// (#14). Deliberately registered outside app.use("/api/workspace", requireAuth)
// below: the client filling this out is not a workspace member and has no
// session. Safety comes from the token itself (opaque, expiring, single-use)
// validated inside the two SECURITY DEFINER RPCs in 0005_intake_tokens.sql —
// getPublicClient() has no elevated privilege, it's a plain anon-key client.
router.get("/api/public/intake/:token", publicLimiter, async (req: Request, res: Response) => {
  const { data, error } = await getPublicClient().rpc("get_intake_token_info", { p_token: req.params.token });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  const info = Array.isArray(data) ? data[0] : data;
  if (!info) {
    res.status(404).json({ error: "This link is invalid or has expired." });
    return;
  }
  res.json({ success: true, info });
});

router.post("/api/public/intake/:token/complete", publicLimiter, async (req: Request, res: Response) => {
  const { data, error } = await getPublicClient().rpc("complete_intake_token", {
    p_token: req.params.token,
    p_payload: req.body?.payload || {},
  });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(410).json({ error: "This link has already been used or has expired." });
    return;
  }
  res.json({ success: true });
});
  return router;
}
