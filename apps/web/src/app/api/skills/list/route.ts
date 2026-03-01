import { NextResponse } from "next/server";
import { listSkills } from "@/lib/skills";

export async function GET() {
  const skills = await listSkills();
  return NextResponse.json(
    skills.map((s) => ({
      name: s.meta.name,
      description: s.meta.description,
      version: s.meta.version,
      tools: s.meta.tools,
      composable_with: s.meta.composable_with,
    }))
  );
}
