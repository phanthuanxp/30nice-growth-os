import Image from "next/image";
import Link from "next/link";
import { COMPANY, publicNav } from "./site";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const size = compact ? 42 : 50;
  return <span className="inline-flex shrink-0 items-center justify-center">
    <Image src="/brand/gfvgo-icon.png" alt="GFVGO" width={size} height={size} className="h-auto w-auto" priority={!compact} />
  </span>;
}

export function IconBubble({ children, tone = "indigo" }: { children: React.ReactNode; tone?: "indigo" | "cyan" | "emerald" | "amber" | "rose" | "slate" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-100 text-slate-800 ring-slate-200",
  } as const;
  return <span className={`inline-grid h-12 w-12 place-items-center rounded-2xl text-xl ring-1 ${tones[tone]}`}>{children}</span>;
}

export function PublicHeader() {
  return <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <Link href="/" aria-label="Trang chủ GFVGO" className="flex items-center"><BrandMark /></Link>
      <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">{publicNav.map(([label, href]) => <Link key={href} href={href} className="hover:text-indigo-700">{label}</Link>)}</nav>
      <Link href="/login" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Đăng nhập</Link>
    </div>
  </header>;
}

export function PublicFooter() {
  const links = [...publicNav.slice(1), ["Chính sách quyền riêng tư", "/chinh-sach-bao-mat"], ["Điều khoản sử dụng", "/dieu-khoan-su-dung"], ["Xóa dữ liệu người dùng", "/xoa-du-lieu"], ["Đăng nhập", "/login"]] as const;
  return <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
      <div><div><BrandMark compact /></div><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">Nền tảng quản lý nội dung, SEO, social publishing và vận hành tăng trưởng tập trung cho doanh nghiệp.</p><p className="mt-4 text-sm leading-6">Đơn vị phát triển: {COMPANY.company}</p></div>
      <div><p className="font-bold text-white">Liên kết</p><div className="mt-4 grid gap-3 text-sm">{links.map(([label, href]) => <Link key={href} href={href} className="hover:text-white">{label}</Link>)}</div></div>
      <dl className="text-sm"><dt className="font-bold text-white">Thông tin</dt><dd className="mt-4">Mã số thuế: {COMPANY.taxCode}</dd><dd className="mt-2">Website: <a href={COMPANY.website} className="text-cyan-300">{COMPANY.website}</a></dd><dd className="mt-2">Email: <a href={`mailto:${COMPANY.email}`} className="text-cyan-300">{COMPANY.email}</a></dd><dd className="mt-2">Hotline: {COMPANY.hotline}</dd></dl>
    </div><div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500">© 2026 GFVGO Growth Platform. All rights reserved.</div>
  </footer>;
}

export function PublicLayout({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-white text-slate-900"><PublicHeader /><main>{children}</main><PublicFooter /></div>; }

export function SectionHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) { return <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">{eyebrow}</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>{children && <p className="mt-4 text-lg leading-8 text-slate-600">{children}</p>}</div>; }

export function FeatureCard({ title, children, badge, icon }: { title: string; children: React.ReactNode; badge?: string; icon?: React.ReactNode }) { return <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-700 ring-1 ring-indigo-100 transition group-hover:bg-indigo-600 group-hover:text-white">{icon ?? badge ?? "✦"}</div><h3 className="text-lg font-bold text-slate-950">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{children}</p></div>; }
