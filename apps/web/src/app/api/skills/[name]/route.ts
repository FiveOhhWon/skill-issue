import { NextResponse } from "next/server";
import { getSkill, saveSkill, deleteSkill } from "@/lib/skills";

const SKILL_NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function isValidSkillName(name: string): boolean {
  return SKILL_NAME_RE.test(name);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!isValidSkillName(name)) {
    return NextResponse.json({ error: "Invalid skill name" }, { status: 400 });
  }
  const skill = await getSkill(name);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }
  return NextResponse.json({
    name: skill.meta.name,
    description: skill.meta.description,
    version: skill.meta.version,
    tools: skill.meta.tools,
    composable_with: skill.meta.composable_with,
    body: skill.body,
    raw: skill.raw,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!isValidSkillName(name)) {
    return NextResponse.json({ error: "Invalid skill name" }, { status: 400 });
  }
  const { content } = await request.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "content field required" },
      { status: 400 }
    );
  }
  await saveSkill(name, content);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!isValidSkillName(name)) {
    return NextResponse.json({ error: "Invalid skill name" }, { status: 400 });
  }
  await deleteSkill(name);
  return NextResponse.json({ ok: true });
}
