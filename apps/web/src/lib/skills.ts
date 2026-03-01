import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { SKILLS_DIR } from "@/lib/paths";
import { PIPELINES, type PipelineName } from "@/lib/pipelines";
import { parseSkillMarkdown } from "@/lib/skill-md";

export interface SkillMeta {
  name: string;
  description: string;
  version: string;
  tools: string[];
  output_schema?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
  composable_with?: string[];
}

export interface SkillInfo {
  meta: SkillMeta;
  body: string;
  raw: string;
}

const SKILL_NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function assertSafeSkillName(name: string): string {
  if (!SKILL_NAME_RE.test(name)) {
    throw new Error("Invalid skill name");
  }
  const normalized = basename(name);
  if (normalized !== name) {
    throw new Error("Invalid skill name");
  }
  return normalized;
}

export async function getSkill(name: string): Promise<SkillInfo | null> {
  try {
    const safeName = assertSafeSkillName(name);
    const filePath = join(SKILLS_DIR, safeName, "SKILL.md");
    const raw = await readFile(filePath, "utf-8");
    const parsed = parseSkillMarkdown(raw);
    const frontmatter = parsed.frontmatter as SkillMeta;

    return { meta: frontmatter, body: parsed.body, raw };
  } catch {
    return null;
  }
}

export async function listSkills(): Promise<SkillInfo[]> {
  const skills: SkillInfo[] = [];

  try {
    const dirs = await readdir(SKILLS_DIR, { withFileTypes: true });

    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;
      const skill = await getSkill(dir.name);
      if (skill) skills.push(skill);
    }
  } catch {
    // Skills directory might not exist
  }

  return skills;
}

export async function saveSkill(
  name: string,
  content: string
): Promise<void> {
  const safeName = assertSafeSkillName(name);
  const dir = join(SKILLS_DIR, safeName);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "SKILL.md"), content, "utf-8");
}

export async function deleteSkill(name: string): Promise<void> {
  const safeName = assertSafeSkillName(name);
  await rm(join(SKILLS_DIR, safeName), { recursive: true, force: true });
}
export { PIPELINES, type PipelineName };
