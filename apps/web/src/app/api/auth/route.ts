import { NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { passphrase } = await request.json();
  const success = await setAuthCookie(passphrase);
  if (success) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid passphrase" }, { status: 401 });
}
