import { NextResponse } from "next/server";
import { writeFile, readFile, readdir } from "fs/promises";
import { join } from "path";
import { FIXTURES_DIR } from "@/lib/paths";

const SAFE_FILE_RE = /^[a-zA-Z0-9._-]+$/;

function sanitizeUploadFileName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Filename is required");
  }
  if (trimmed.includes("/") || trimmed.includes("\\")) {
    throw new Error("Invalid filename");
  }
  if (!SAFE_FILE_RE.test(trimmed)) {
    throw new Error("Filename contains unsupported characters");
  }
  return trimmed;
}

export async function GET() {
  try {
    const files = await readdir(FIXTURES_DIR);
    const fixtures = await Promise.all(
      files
        .filter((f) => f.endsWith(".json") || f.endsWith(".csv"))
        .map(async (name) => {
          const content = await readFile(join(FIXTURES_DIR, name), "utf-8");
          const isJson = name.endsWith(".json");
          let preview: unknown;
          try {
            preview = isJson
              ? JSON.parse(content)
              : content.split("\n").slice(0, 6).join("\n");
          } catch {
            preview = content.slice(0, 500);
          }
          return {
            name,
            type: isJson ? "json" : "csv",
            size: content.length,
            preview,
          };
        })
    );
    return NextResponse.json(fixtures);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = [".json", ".csv"];
    if (!allowed.some((ext) => file.name.endsWith(ext))) {
      return NextResponse.json(
        { error: "Only JSON and CSV files are supported" },
        { status: 400 }
      );
    }

    const safeName = sanitizeUploadFileName(file.name);
    const content = await file.text();
    await writeFile(join(FIXTURES_DIR, safeName), content, "utf-8");

    return NextResponse.json({ ok: true, name: safeName });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status =
      message.includes("filename") || message.includes("Filename") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
