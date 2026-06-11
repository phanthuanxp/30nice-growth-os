import { cookies } from "next/headers";
import { createHmac } from "node:crypto";

export type Role =
  | "SUPER_ADMIN"
  | "AGENCY_ADMIN"
  | "TENANT_ADMIN"
  | "EDITOR"
  | "VIEWER";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const SECRET =
  process.env.SESSION_SECRET ?? "30nice-dev-secret-key-min-32-chars!!";
const COOKIE = "30nice_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function parseToken(token: string): SessionUser | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (sign(payload) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return parseToken(token);
}

export async function setSession(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, createSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
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

// Demo credentials — MVP only. Replace with DB lookup in production.
export const DEMO_CREDENTIALS = {
  email: "admin@30nice.vn",
  password: "admin123",
  user: {
    id: "demo-super-admin",
    name: "30Nice Admin",
    email: "admin@30nice.vn",
    role: "SUPER_ADMIN" as Role,
  },
};
