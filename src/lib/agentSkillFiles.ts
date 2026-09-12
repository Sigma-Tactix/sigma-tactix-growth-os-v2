import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Reads and parses the SKILL.md source that backs each agent in the registry
// (copied into backend/agent-skills/ by scripts/sync-agent-skill-files.mts).
//
// Section headings are NOT uniform across the 181 files — the same section
// appears as "## 🧠 Your Identity & Memory", "## Your Identity & Memory" and
// "## Identity & Memory" depending on the file. So rather than hunting for a
// fixed schema (which would silently drop content), this parses EVERY H2
// section and normalizes its title for grouping. Nothing in the file is
// discarded, and nothing is invented for files that lack a given section.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolved relative to this module so it works both under tsx (src/lib/) and
// in the esbuild bundle (dist/), where the file sits one level deeper.
function resolveSkillsRoot(): string {
  const candidates = [
    path.resolve(__dirname, "../../backend/agent-skills"),
    path.resolve(__dirname, "../backend/agent-skills"),
    path.resolve(process.cwd(), "backend/agent-skills"),
  ];
  return candidates.find(c => fs.existsSync(c)) || candidates[candidates.length - 1];
}

export interface SkillSection {
  title: string;        // normalized, emoji/"Your " stripped
  rawTitle: string;     // exactly as written in the file
  content: string;      // markdown body of the section
}

export interface ParsedSkillFile {
  found: boolean;
  name?: string;
  description?: string;
  title?: string;       // the H1
  sections: SkillSection[];
}

function normalizeHeading(raw: string): string {
  return raw
    // strip leading emoji / pictographs and any whitespace they leave behind
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍]+\s*/gu, "")
    .replace(/^Your\s+/i, "")
    .trim();
}

export function parseSkillFile(folder: string): ParsedSkillFile {
  // Path traversal guard — `folder` originates from a URL parameter.
  if (!folder || folder.includes("..") || folder.includes("/") || folder.includes("\\")) {
    return { found: false, sections: [] };
  }

  const filePath = path.join(resolveSkillsRoot(), folder, "SKILL.md");
  if (!fs.existsSync(filePath)) return { found: false, sections: [] };

  const raw = fs.readFileSync(filePath, "utf8");

  // YAML frontmatter (name/description) — every generated file has it, but
  // treat it as optional so a hand-written file still parses.
  let body = raw;
  let name: string | undefined;
  let description: string | undefined;
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fmMatch) {
    body = raw.slice(fmMatch[0].length);
    const nameMatch = fmMatch[1].match(/^name:\s*(.+)$/m);
    const descMatch = fmMatch[1].match(/^description:\s*(.+)$/m);
    name = nameMatch?.[1].trim();
    description = descMatch?.[1].trim();
  }

  const h1Match = body.match(/^#\s+(.+)$/m);
  const title = h1Match?.[1].trim();

  // Split on H2 boundaries. Deeper headings (###) stay inside their parent
  // section's content — collapsing them into separate top-level sections
  // would scramble the reading order of files like the SEO specialist's,
  // which nests whole templates under one H2.
  const sections: SkillSection[] = [];
  const parts = body.split(/^##\s+(.+)$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const rawTitle = parts[i].trim();
    const content = (parts[i + 1] || "").trim();
    if (!content) continue;
    sections.push({ title: normalizeHeading(rawTitle), rawTitle, content });
  }

  return { found: true, name, description, title, sections };
}
