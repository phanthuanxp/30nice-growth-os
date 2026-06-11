"use client";

import { useRouter } from "next/navigation";
import { LogOut, Bell, User } from "lucide-react";
import type { SessionUser } from "@/server/auth/session";
import { ROLE_LABELS } from "@/server/permissions";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  user: SessionUser;
  title?: string;
}

export function AdminHeader({ user, title }: AdminHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-6">
      <div>
        {title && (
          <h1 className="text-base font-semibold text-slate-800">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
            <User className="h-4 w-4" />
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Đăng xuất"
          className="text-slate-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
