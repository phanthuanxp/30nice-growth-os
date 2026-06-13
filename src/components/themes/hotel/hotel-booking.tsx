"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, MapPin, Mail, Loader2, CheckCircle2, BedDouble, Building2 } from "lucide-react";
import type { HotelThemeConfig } from "./types";

export function HotelBooking({ config }: { config: HotelThemeConfig }) {
  const [form, setForm] = useState({
    name: "", phone: "", checkin: "", checkout: "", guests: "2", room: "", note: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setState("sending");
    const message = [
      "[Đặt phòng]",
      form.room && `Loại phòng: ${form.room}`,
      form.checkin && `Check-in: ${form.checkin}`,
      form.checkout && `Check-out: ${form.checkout}`,
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
    "w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30";

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-cyan-900 via-cyan-800 to-slate-900" id="dat-phong">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{config.bookingTitle}</h2>
          <p className="text-cyan-100/85 mt-3 max-w-xl mx-auto">{config.bookingSubtitle}</p>
        </div>

        <div className="rounded-3xl bg-white shadow-2xl p-6 sm:p-8">
          {state === "done" ? (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="text-lg font-bold text-slate-900">Đã nhận yêu cầu đặt phòng!</h3>
              <p className="text-sm text-slate-500 mt-1.5">
                Lễ tân sẽ gọi <span className="font-semibold text-slate-700">{form.phone}</span> xác nhận phòng trống và giá trong ít phút.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input value={form.name} onChange={set("name")} placeholder="Tên của bạn *" className={inputCls} />
              <input value={form.phone} onChange={set("phone")} placeholder="Số điện thoại *" type="tel" inputMode="tel" className={inputCls} />
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nhận phòng</label>
                <input value={form.checkin} onChange={set("checkin")} type="date" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Trả phòng</label>
                <input value={form.checkout} onChange={set("checkout")} type="date" className={inputCls} />
              </div>
              <select value={form.room} onChange={set("room")} aria-label="Loại phòng" className={inputCls}>
                <option value="">Chọn loại phòng (tùy chọn)</option>
                {config.rooms.map((r) => (
                  <option key={r.name} value={r.name}>{r.name} — {r.price}{r.priceUnit}</option>
                ))}
              </select>
              <select value={form.guests} onChange={set("guests")} aria-label="Số khách" className={inputCls}>
                {["1", "2", "3", "4", "5", "6", "6+"].map((n) => (
                  <option key={n} value={n}>{n} khách</option>
                ))}
              </select>
              <textarea
                value={form.note}
                onChange={set("note")}
                placeholder="Ghi chú (giờ đến, yêu cầu đặc biệt...)"
                rows={2}
                className="sm:col-span-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
              <button
                onClick={submit}
                disabled={state === "sending" || !form.name.trim() || !form.phone.trim()}
                className="sm:col-span-2 h-12 rounded-xl bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {state === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : <BedDouble className="h-5 w-5" />}
                Gửi yêu cầu đặt phòng
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

export function HotelFooter({
  config, siteName, logoUrl, email, address,
}: {
  config: HotelThemeConfig;
  siteName: string;
  logoUrl?: string | null;
  email?: string | null;
  address?: string | null;
}) {
  const phoneHref = `tel:${config.phone.replace(/\s/g, "")}`;
  return (
    <footer className="bg-slate-900 text-slate-300" id="lien-he">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} className="h-10 w-auto object-contain" />
            ) : (
              <>
                <div className="h-9 w-9 rounded-xl bg-cyan-700 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <p className="text-white font-bold">{siteName}</p>
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed text-slate-400">{config.footerAbout}</p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Liên kết</h3>
          <ul className="space-y-2.5">
            {config.footerLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Liên hệ</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={phoneHref} className="flex items-center gap-2.5 hover:text-cyan-400 transition-colors">
                <Phone className="h-4 w-4 text-cyan-500 shrink-0" />
                {config.phone}
              </a>
            </li>
            {email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-cyan-500 shrink-0" />
                {email}
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                {address}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {config.copyrightName}. Hotline đặt phòng: {config.phone}
        </div>
      </div>
    </footer>
  );
}
