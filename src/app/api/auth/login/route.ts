import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { setSession } from "@/server/auth/session";
import { RateLimiter } from "@/server/auth/rate-limit";
import { getUserByEmail } from "@/server/queries/users";
import { writeAuditLog } from "@/server/audit/log";
import type { Role } from "@/server/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Two windows: one per source address to slow a single attacker, one per account
// so a distributed attempt cannot grind through a specific inbox either.
const addressLimiter = new RateLimiter({ limit: 10, windowMs: 10 * 60_000 });
const accountLimiter = new RateLimiter({ limit: 5, windowMs: 10 * 60_000 });

function clientAddress(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function tooManyAttempts(retryAfter: number) {
  return NextResponse.json(
    { error: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ ít phút rồi thử lại." },
    { status: 429, headers: { "Retry-After": String(Math.max(retryAfter, 1)) } },
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  // Throttle on the normalized address so casing variants share one window;
  // the lookup itself keeps the value the user typed.
  const accountKey = email.toLowerCase();
  const address = clientAddress(request);

  const byAddress = addressLimiter.consume(address);
  if (!byAddress.allowed) return tooManyAttempts(byAddress.retryAfter);
  const byAccount = accountLimiter.consume(accountKey);
  if (!byAccount.allowed) return tooManyAttempts(byAccount.retryAfter);

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

    addressLimiter.reset(address);
    accountLimiter.reset(accountKey);

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
