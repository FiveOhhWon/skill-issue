import { NextResponse } from "next/server";
import { listRuns, getRun } from "@/lib/history";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const run = getRun(id);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json(run);
  }

  const runs = listRuns({
    type: searchParams.get("type") || undefined,
    status: searchParams.get("status") || undefined,
    name: searchParams.get("name") || undefined,
    limit: searchParams.has("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined,
  });

  return NextResponse.json(runs);
}
