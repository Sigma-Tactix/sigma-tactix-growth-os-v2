#!/usr/bin/env bash
# Turn off nounset in case this is sourced in interactive zsh
set +u 2>/dev/null || true

ok(){ printf "  [ok]   %s\n" "$1"; }
bad(){ printf "  [skip] %s  (failed or needs a token)\n" "$1"; }
run(){
  lbl="$1"; shift
  if "$@" >/dev/null 2>&1; then ok "$lbl"; else bad "$lbl"; fi
}

echo "== 0) Prerequisites =="
if command -v uvx >/dev/null 2>&1; then ok "uvx found"; else bad "uvx (needed for Python MCP servers; install: curl -LsSf https://astral.sh/uv/install.sh | sh)"; fi

echo "== 1) SKILLS (Non-interactive with exact skill targets) =="
run "skills: supabase"      npx -y skills add supabase/agent-skills --all -g -y
run "skills: anthropics"    npx -y skills add anthropics/skills --all -g -y
run "skills: vercel-react"  npx -y skills add vercel-labs/agent-skills --all -g -y
run "skills: vitest"        npx -y skills add antfu/skills --skill vitest -g -y
run "skills: find-skills"   npx -y skills add vercel-labs/skills --all -g -y
run "skills: firecrawl"     npx -y skills add firecrawl/skills --skill firecrawl -g -y

echo "== 2) MCP servers (Claude Code - Stdio) =="
run "mcp: context7" claude mcp add context7 -- npx -y @upstash/context7-mcp
run "mcp: vercel"   claude mcp add vercel   -- npx -y vercel-mcp
run "mcp: stripe"   claude mcp add stripe   -- npx -y @stripe/mcp

echo "== 2b) Local MCP servers (official modelcontextprotocol) =="
# npm packages: server-memory, server-sequential-thinking, server-filesystem
# Python packages (need uv): mcp-server-fetch, mcp-server-git, mcp-server-time
run "mcp: memory"      claude mcp add memory      --env MEMORY_FILE_PATH="$HOME/.claude/mcp-memory/graph.json" -- npx -y @modelcontextprotocol/server-memory
run "mcp: seq-thinking" claude mcp add seq-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
run "mcp: fetch"       claude mcp add fetch       -- uvx mcp-server-fetch
run "mcp: git"         claude mcp add git         -- uvx mcp-server-git
run "mcp: time"         claude mcp add time        -- uvx mcp-server-time
run "mcp: filesystem"  claude mcp add filesystem  -- npx -y @modelcontextprotocol/server-filesystem "${CLAUDE_PROJECT_DIR:-$PWD}"

echo "== 3) Remote HTTP MCPs (Claude Code - Remote) =="
run "mcp: supabase" claude mcp add --transport http supabase "https://mcp.supabase.com/mcp"
run "mcp: sentry"   claude mcp add --transport http sentry   "https://mcp.sentry.dev/mcp"
run "mcp: linear"   claude mcp add --transport http linear   "https://mcp.linear.app/mcp"
run "mcp: notion"   claude mcp add --transport http notion   "https://mcp.notion.com/mcp"

echo ""
echo "== 4) Active Status =="
echo "--- MCPs in Claude Code ---"
claude mcp list || true
echo ""
echo "--- Installed Skills ---"
npx -y skills list || true
