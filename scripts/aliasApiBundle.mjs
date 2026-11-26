// Alias the Vercel API bundle to the standalone server bundle.
//
// The two artifacts (dist/server.js and build/server.mjs) used to be two
// separate esbuild bundles of the same server.ts. They have identical content
// apart from the sourcemap, and no consumer requires build/server.mjs to lack
// one. So we build ONCE (the standalone bundle, with sourcemap) and alias the
// Vercel entry to it, copying only the .mjs — never the .map. That keeps the
// Vercel upload byte-identical to today and removes a duplicate build step.

import {
  existsSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
} from 'node:fs';

const SRC = 'dist/server.js';
const OUT_DIR = 'build';
const OUT = 'build/server.mjs';

if (!existsSync(SRC)) {
  console.error(`[aliasApiBundle] missing ${SRC}; run \`npm run build\` first.`);
  process.exit(1);
}

// The Vercel function imports this file; create the directory so the import
// never fails when build/ does not yet exist.
mkdirSync(OUT_DIR, { recursive: true });

// Copy ONLY the bundle, not dist/server.js.map — no new files reach Vercel.
copyFileSync(SRC, OUT);
writeFileSync(
  `${OUT}.alias`,
  `aliased to ${SRC} by scripts/aliasApiBundle.mjs\n`,
);

console.log(`[aliasApiBundle] aliased ${OUT} -> ${SRC}`);
