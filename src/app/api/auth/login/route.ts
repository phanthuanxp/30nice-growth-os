import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { setSession, DEMO_CREDENTIALS } from "@/server/auth/session";
import { getUserByEmail } from "@/server/queries/users";
import type { Role } from "@/server/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // 1. Try real DB user first
  try {
    const dbUser = await getUserByEmail(email);
    if (dbUser?.passwordHash) {
      const valid = await bcrypt.compare(password, dbUser.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
      }
      await setSession({
        id: dbUser.id,
        name: dbUser.name ?? email,
        email: dbUser.email,
        role: dbUser.role as Role,
      });
      return NextResponse.json({ ok: true });
    }
  } catch {
    // DB not available — fall through to demo credentials
  }

  // 2. Fallback: demo credentials (MVP / no DB)
  if (
    email === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  ) {
    await setSession(DEMO_CREDENTIALS.user);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
}
