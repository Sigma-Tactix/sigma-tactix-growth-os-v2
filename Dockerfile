# SigmaTactix Growth OS — production image.
#
# Multi-stage build:
#   build:    npm ci + npm run build  -> dist/ (Vite client assets + bundled dist/server.js)
#   runtime:  node dist/server.js on Node 22, non-root user, NODE_ENV=production
#
# The runtime server serves the built SPA from dist/ automatically (the static
# block in server.ts is guarded on dist/index.html existing), so one image
# ships both the API gateway and the frontend. See DEPLOY.md for the runbook.
#
# Build:   docker build -t sigmatactix .
# Run:     docker run -p 3000:3000 --env-file .env sigmatactix
#
# Note: alpine keeps the image small but the optional Playwright/Chromium
# browser download is skipped, so the audit-screenshot and
# landing-artifact-preview features are unavailable on this base. If those
# features matter, switch both FROM lines to node:22 (Debian) and drop the
# PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD line.

# ---------------------------------------------------------------------------
# Build stage: full install (devDeps included) + client & server build.
FROM node:22-alpine AS build
WORKDIR /app

# Lockfile first for layer caching, then the rest of the source.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Vite client build (-> dist/) + esbuild server bundle (-> dist/server.js).
RUN npm run build

# ---------------------------------------------------------------------------
# Runtime stage.
#
# Full `npm ci` (devDeps included) on purpose: dist/server.js keeps a static
# `import ... from "vite"` at module load (the dev-only Vite branch is dead
# code in production, but ESM module evaluation still resolves every static
# import). `--omit=dev` would break the server at boot. Playwright's browser
# download is skipped to keep the image slim and the build deterministic.
FROM node:22-alpine
# python3 is required only for the optional Lecture Deck engine
# (tools/lecture-deck-skill), which spawns `python3`. Everything else works
# without it.
RUN apk add --no-cache python3 \
    && addgroup -S node && adduser -S node -G node

WORKDIR /app
COPY package.json package-lock.json ./
RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci

# Bundle + client assets. --chown so the non-root user can write to
# dist/decks/ and dist/audit_evidence/ at runtime.
COPY --chown=node:node dist ./dist
# Runtime reads these from disk: agent SKILL.md files and the deck scripts.
COPY --chown=node:node backend ./backend
COPY --chown=node:node tools ./tools

USER node

ENV NODE_ENV=production
# Port the server listens on (server.ts defaults to 3000 when PORT is unset;
# set TRUST_PROXY=1 when running behind a reverse proxy).
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/server.js"]
