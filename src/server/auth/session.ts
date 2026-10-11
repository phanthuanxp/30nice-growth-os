import { cookies } from "next/headers";
import { createSessionToken, parseSessionToken, SESSION_MAX_AGE, type Role, type SessionUser } from "@/server/auth/token";

export type { Role, SessionUser };

const RAW_SECRET = process.env.SESSION_SECRET;
if (process.env.NODE_ENV === "production" && !RAW_SECRET) {
  throw new Error("SESSION_SECRET environment variable must be set in production");
}
const SECRET = RAW_SECRET ?? "30nice-dev-secret-key-min-32-chars!!";
const COOKIE = "30nice_session";

export function signSession(user: SessionUser): string {
  return createSessionToken(user, SECRET);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token, SECRET);
}

export async function setSession(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, signSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  return user;
}
