import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { setSession } from "@/server/auth/session";
import { getUserByEmail } from "@/server/queries/users";
import { writeAuditLog } from "@/server/audit/log";
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

  try {
    const dbUser = await getUserByEmail(email);
    if (!dbUser?.passwordHash) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, dbUser.passwordHash);
    if (!valid) {
      await writeAuditLog({ userId: dbUser.id, action: "auth.login_failed", resource: "User" });
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    await setSession({
      id: dbUser.id,
      name: dbUser.name ?? email,
      email: dbUser.email,
      role: dbUser.role as Role,
    });
    await writeAuditLog({ userId: dbUser.id, action: "auth.login_success", resource: "User" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không thể đăng nhập lúc này" }, { status: 500 });
  }
}
