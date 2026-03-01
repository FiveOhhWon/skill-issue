import { cookies } from "next/headers";

const COOKIE_NAME = "skill-issue-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET;
}

export function isAuthEnabled(): boolean {
  return !!getAuthSecret();
}

export async function isAuthenticated(): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return token === getAuthSecret();
}

export async function setAuthCookie(passphrase: string): Promise<boolean> {
  const secret = getAuthSecret();
  if (!secret) return true;
  if (passphrase !== secret) return false;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, passphrase, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return true;
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
