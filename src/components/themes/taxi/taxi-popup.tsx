"use client";

import { useEffect, useRef, useState } from "react";
import { X, Phone, Loader2, CheckCircle2 } from "lucide-react";
import type { TaxiThemeConfig } from "./types";

const DISMISS_KEY = "30nice_popup_dismissed";

export function TaxiPopup({ config }: { config: TaxiThemeConfig }) {
  const popup = config.popup;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const shownRef = useRef(false);

  useEffect(() => {
    if (!popup?.enabled || shownRef.current) return;

    // Session-scoped dismissal so the popup doesn't nag on every page
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch { /* storage unavailable */ }

    const show = () => {
      if (shownRef.current) return;
      shownRef.current = true;
      setOpen(true);
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) show();
    };

    if (popup.trigger === "time-delay") {
      timer = setTimeout(show, Math.max(3, popup.delaySeconds) * 1000);
    } else {
      document.addEventListener("mouseout", onMouseOut);
      // Mobile has no exit-intent — fall back to a generous delay
      timer = setTimeout(show, Math.max(20, popup.delaySeconds) * 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [popup]);

  if (!popup?.enabled || !open) return null;

  const dismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch { /* storage unavailable */ }
  };

  const submit = async () => {
    if (!name.trim() || !phone.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, message: "[Popup] Yêu cầu gọi lại tư vấn" }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
      try {
        sessionStorage.setItem(DISMISS_KEY, "1");
      } catch { /* storage unavailable */ }
      setTimeout(() => setOpen(false), 2500);
    } catch {
      setState("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={popup.title}
      onClick={(e) => e.target === e.currentTarget && dismiss()}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-[popup-in_.25s_ease-out]">
        <button
          onClick={dismiss}
          aria-label="Đóng"
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 hover:bg-slate-100 flex items-center justify-center text-slate-500 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 pt-7 pb-6 text-center">
          <p className="text-2xl mb-1.5">🚖</p>
          <h2 className="text-lg font-bold text-white leading-snug">{popup.title}</h2>
          <p className="text-sm text-blue-100 mt-1.5">{popup.description}</p>
        </div>

        <div className="p-6">
          {state === "done" ? (
            <div className="flex flex-col items-center text-center py-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Đã nhận thông tin! Tài xế sẽ gọi lại cho bạn ngay.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên của bạn"
                className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Số điện thoại"
                type="tel"
                inputMode="tel"
                className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <button
                onClick={submit}
                disabled={state === "sending" || !name.trim() || !phone.trim()}
                className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                {popup.ctaText}
              </button>
              {state === "error" && (
                <p className="text-xs text-red-600 text-center">Gửi không thành công — gọi trực tiếp {config.phone}.</p>
              )}
              <a
                href={`tel:${config.phone.replace(/\s/g, "")}`}
                className="block text-center text-xs text-slate-400 hover:text-blue-700"
              >
                Hoặc gọi ngay: <span className="font-semibold">{config.phone}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
