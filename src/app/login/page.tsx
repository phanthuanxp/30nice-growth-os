"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/admin/dashboard";

  const [email, setEmail] = useState("admin@30nice.vn");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push(from);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(
        (data as { error?: string }).error ?? "Đăng nhập thất bại. Thử lại."
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@30nice.vn"
        required
        autoComplete="email"
        className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:ring-indigo-500"
      />
      <Input
        label="Mật khẩu"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
        autoComplete="current-password"
        className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:ring-indigo-500"
      />

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full h-10 mt-2" loading={loading}>
        Đăng nhập
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,70,229,0.25) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white font-extrabold text-lg mb-4"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
            }}
          >
            30
          </div>
          <h1 className="text-2xl font-bold text-white">30Nice Growth OS</h1>
          <p className="text-slate-400 text-sm mt-1">
            Đăng nhập vào hệ thống quản trị
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <Suspense fallback={<div className="h-40 flex items-center justify-center text-slate-400 text-sm">Đang tải...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-600">
            Dùng tài khoản quản trị đã được tạo trong database.
          </p>
        </div>
      </div>
    </div>
  );
}
