import { Router, type Request, type Response } from 'express';
import * as fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';

// ---------------------------------------------------------------------------
// Lecture deck engine + routes — Phase 3 Presentation Engine. Generates
// self-contained interactive animated HTML decks (via a python3 subprocess)
// plus view/download routes.
//
// Extracted from server.ts (P2 increment 16 of the router-extraction
// program, see docs/OPTIMIZATION_AUDIT.md). The three PUBLIC pre-auth
// registrations (/api/reports/deck/generate, /:id/view, /:id/download) are
// registered outside app.use("/api/workspace", requireAuth) and deliberately
// stay so: a browser <iframe>/link into a generated deck carries no Bearer
// header, so view/download must remain unauthenticated. The single
// /api/workspace/reports/deck/generate route is the authed twin — it shares
// the same handler and the SAME module-scope lectureDeckCache, so a deck
// generated through the workspace route is viewable at the public view/download
// URLs it returns.
//
// All four routes therefore co-move into ONE root-mounted router
// (app.use(createLectureDeckRouter({ baseDir }))) at the original position —
// strictly after app.use("/api", apiLimiter) AND app.use("/api/workspace",
// requireAuth) — so the public routes keep their unauthenticated posture
// (limiter only) while the workspace route additionally passes requireAuth,
// exactly as the inline registrations did.
//
// baseDir is the server.ts module's own __dirname: the project root in dev
// (tsx watch server.ts) and dist/ in the esbuild bundle. It replaces the
// engine's 4 __dirname call sites so python3 script + dist/decks resolution
// is byte-identical in both environments.
// ---------------------------------------------------------------------------

// (interface co-moves from server.ts; region-local, 0 refs elsewhere)
interface LectureDeckArtifact {
  html: string;
  filename: string;
  title: string;
  slideCount: number;
  theme: string;
  createdAt: number;
}
export interface LectureDeckRouterDeps {
  /** The server.ts module's __dirname (project root in dev, dist/ in the bundle). */
  baseDir: string;
}

export function createLectureDeckRouter({ baseDir }: LectureDeckRouterDeps): Router {
  const router = Router();

const lectureDeckCache = new Map<string, LectureDeckArtifact>();

async function generateLectureDeck(payload: any, options: { theme?: string; type?: string } = {}): Promise<LectureDeckArtifact & { deckId: string; viewUrl: string; downloadUrl: string }> {
  return new Promise((resolve, reject) => {
    const deckId = payload.id || crypto.randomBytes(4).toString("hex");
    const scriptPath = path.resolve(baseDir, "tools/lecture-deck-skill/scripts/generate_from_report.py");
    const outDir = path.resolve(baseDir, "dist/decks");

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const theme = options.theme || payload.theme || "sigmatactix";
    const deckType = options.type || "auto";

    const proc = spawn("python3", [
      scriptPath,
      "--stdin",
      "--theme", theme,
      "--out-dir", outDir,
      "--type", deckType
    ]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn deck generator: ${err.message}`));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Deck generator failed (exit ${code}): ${stderr || stdout}`));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        const html = fs.readFileSync(parsed.htmlPath, "utf-8");
        const artifact: LectureDeckArtifact = {
          html,
          filename: parsed.filename,
          title: parsed.title,
          slideCount: parsed.slideCount,
          theme: parsed.theme,
          createdAt: Date.now()
        };
        lectureDeckCache.set(parsed.deckId, artifact);
        resolve({
          ...artifact,
          deckId: parsed.deckId,
          viewUrl: `/api/reports/deck/${parsed.deckId}/view`,
          downloadUrl: `/api/reports/deck/${parsed.deckId}/download`
        });
      } catch (err: any) {
        reject(new Error(`Failed to parse deck generator output: ${err.message}. Output was: ${stdout}`));
      }
    });

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
}

// Handler for generating a presentation deck
const handleDeckGeneration = async (req: Request, res: Response) => {
  try {
    const { reportData, theme, type } = req.body;
    if (!reportData) {
      return res.status(400).json({ error: "reportData is required" });
    }
    const result = await generateLectureDeck(reportData, { theme, type });
    res.json({
      success: true,
      deckId: result.deckId,
      title: result.title,
      slideCount: result.slideCount,
      theme: result.theme,
      filename: result.filename,
      viewUrl: result.viewUrl,
      downloadUrl: result.downloadUrl
    });
  } catch (err: any) {
    console.error("Lecture Deck generation error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
};

router.post('/api/reports/deck/generate', handleDeckGeneration);
router.post('/api/workspace/reports/deck/generate', handleDeckGeneration);

// Serve interactive fullscreen presentation deck in browser
router.get('/api/reports/deck/:id/view', (req: Request, res: Response) => {
  const deck = lectureDeckCache.get(req.params.id);
  if (!deck) {
    const outDir = path.resolve(baseDir, "dist/decks");
    if (fs.existsSync(outDir)) {
      const files = fs.readdirSync(outDir);
      const match = files.find(f => f.includes(req.params.id) && f.endsWith(".html"));
      if (match) {
        const html = fs.readFileSync(path.join(outDir, match), "utf-8");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(html);
      }
    }
    return res.status(404).send("Lecture deck presentation not found or expired.");
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(deck.html);
});

// Download standalone HTML deck for offline presentation
router.get('/api/reports/deck/:id/download', (req: Request, res: Response) => {
  const deck = lectureDeckCache.get(req.params.id);
  let html = deck?.html;
  let filename = deck?.filename || `sigmatactix-presentation-${req.params.id}.html`;
  if (!html) {
    const outDir = path.resolve(baseDir, "dist/decks");
    if (fs.existsSync(outDir)) {
      const files = fs.readdirSync(outDir);
      const match = files.find(f => f.includes(req.params.id) && f.endsWith(".html"));
      if (match) {
        html = fs.readFileSync(path.join(outDir, match), "utf-8");
        filename = match;
      }
    }
  }
  if (!html) {
    return res.status(404).json({ error: "Lecture deck artifact not found" });
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(html);
});

  return router;
}
