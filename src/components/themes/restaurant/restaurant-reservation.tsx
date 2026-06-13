"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, MapPin, Mail, Clock, Loader2, CheckCircle2, CalendarCheck, UtensilsCrossed } from "lucide-react";
import type { RestaurantThemeConfig } from "./types";

export function RestaurantReservation({ config }: { config: RestaurantThemeConfig }) {
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", guests: "2", note: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setState("sending");
    const message = [
      "[Đặt bàn]",
      form.date && `Ngày: ${form.date}`,
      form.time && `Giờ: ${form.time}`,
      `Số khách: ${form.guests}`,
      form.note && `Ghi chú: ${form.note}`,
    ]
      .filter(Boolean)
      .join(" · ");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, message }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
    } catch {
      setState("error");
    }
  };

  const inputCls =
    "w-full h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-500/30";

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-red-900 via-red-800 to-red-900" id="dat-ban">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{config.reservationTitle}</h2>
          <p className="text-amber-100/85 mt-3 max-w-xl mx-auto">{config.reservationSubtitle}</p>
        </div>

        <div className="rounded-3xl bg-white shadow-2xl p-6 sm:p-8">
          {state === "done" ? (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="text-lg font-bold text-stone-900">Đã nhận yêu cầu đặt bàn!</h3>
              <p className="text-sm text-stone-500 mt-1.5">
                Nhà hàng sẽ gọi <span className="font-semibold text-stone-700">{form.phone}</span> để xác nhận trong ít phút.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input value={form.name} onChange={set("name")} placeholder="Tên của bạn *" className={inputCls} />
              <input value={form.phone} onChange={set("phone")} placeholder="Số điện thoại *" type="tel" inputMode="tel" className={inputCls} />
              <input value={form.date} onChange={set("date")} type="date" aria-label="Ngày đặt bàn" className={inputCls} />
              <div className="grid grid-cols-2 gap-4">
                <input value={form.time} onChange={set("time")} type="time" aria-label="Giờ đặt bàn" className={inputCls} />
                <select value={form.guests} onChange={set("guests")} aria-label="Số khách" className={inputCls}>
                  {["1", "2", "3", "4", "5", "6", "8", "10", "10+"].map((n) => (
                    <option key={n} value={n}>{n} khách</option>
                  ))}
                </select>
              </div>
              <textarea
                value={form.note}
                onChange={set("note")}
                placeholder="Ghi chú (sinh nhật, phòng riêng, món đặt trước...)"
                rows={2}
                className="sm:col-span-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
              <button
                onClick={submit}
                disabled={state === "sending" || !form.name.trim() || !form.phone.trim()}
                className="sm:col-span-2 h-12 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {state === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarCheck className="h-5 w-5" />}
                Gửi yêu cầu đặt bàn
              </button>
              {state === "error" && (
                <p className="sm:col-span-2 text-sm text-red-600 text-center">
                  Gửi không thành công — vui lòng gọi trực tiếp {config.phone}.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function RestaurantFooter({
  config, siteName, logoUrl, email, address,
}: {
  config: RestaurantThemeConfig;
  siteName: string;
  logoUrl?: string | null;
  email?: string | null;
  address?: string | null;
}) {
  const phoneHref = `tel:${config.phone.replace(/\s/g, "")}`;
  return (
    <footer className="bg-stone-900 text-stone-300" id="lien-he">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} className="h-10 w-auto object-contain" />
            ) : (
              <>
                <div className="h-9 w-9 rounded-xl bg-red-700 flex items-center justify-center">
                  <UtensilsCrossed className="h-5 w-5 text-amber-50" />
                </div>
                <p className="text-white font-bold">{siteName}</p>
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed text-stone-400">{config.footerAbout}</p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Liên kết</h3>
          <ul className="space-y-2.5">
            {config.footerLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-stone-400 hover:text-amber-400 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Liên hệ & Giờ mở cửa</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={phoneHref} className="flex items-center gap-2.5 hover:text-amber-400 transition-colors">
                <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                {config.phone}
              </a>
            </li>
            {email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                {email}
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                {address}
              </li>
            )}
            <li className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
              {config.openHours}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} {config.copyrightName}. Đặt bàn: {config.phone}
        </div>
      </div>
    </footer>
  );
}
