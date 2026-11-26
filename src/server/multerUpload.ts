// ---------------------------------------------------------------------------
// Single shared multer instance — the 20 MB / single-file "vault & skills"
// uploader.
//
// Hoisted out of server.ts (P2 increment 10 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). Both the vault/skills router
// (src/server/routes/vaultRoutes.ts) and the still-inline performance routes
// consume this ONE instance, so the 20 MB ceiling and memory storage are
// defined in exactly one place. When the performance routes are later
// extracted they import this same module, keeping a single config.
// ---------------------------------------------------------------------------

import multer from "multer";

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
