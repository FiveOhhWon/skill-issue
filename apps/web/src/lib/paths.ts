import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

function findRepoRoot(): string {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "../.."),
  ];

  for (const candidate of candidates) {
    if (
      existsSync(join(candidate, "package.json")) &&
      existsSync(join(candidate, "plugin")) &&
      existsSync(join(candidate, "fixtures"))
    ) {
      return candidate;
    }
  }

  return process.cwd();
}

export const REPO_ROOT = findRepoRoot();
export const PLUGIN_DIR = join(REPO_ROOT, "plugin");
const PROJECT_SKILLS_DIR = join(REPO_ROOT, ".claude", "skills");
export const SKILLS_DIR = existsSync(PROJECT_SKILLS_DIR)
  ? PROJECT_SKILLS_DIR
  : join(PLUGIN_DIR, "skills");
export const FIXTURES_DIR = join(REPO_ROOT, "fixtures");
