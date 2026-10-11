import type { Metadata } from "next";
import { PublicLayout, SectionHeader, FeatureCard } from "@/components/marketing/public-layout";
import { publicMetadata } from "@/components/marketing/seo";

export const metadata: Metadata = publicMetadata("/giai-phap", "Giải pháp CMS, SEO và Social Growth", "Giải pháp cho doanh nghiệp, agency, SEO team, marketing team, content team và social media team.");

const solutions = [
  { icon: "🏢", title: "Doanh nghiệp nhiều website", body: "Chuẩn hóa cách quản lý domain, trang, bài viết, SEO và dữ liệu liên hệ trên nhiều website cùng lúc." },
  { icon: "🧑‍💼", title: "Agency vận hành khách hàng", body: "Tách dự án, kiểm soát quyền truy cập, quản lý kế hoạch nội dung và lịch xuất bản cho nhiều khách hàng." },
  { icon: "🔎", title: "SEO team", body: "Từ keyword research đến content plan, brief, xuất bản và đo lường — tất cả nằm trong cùng một workflow." },
  { icon: "✍️", title: "Content team", body: "Giảm rời rạc khi viết, review, cập nhật, tối ưu và publish nội dung theo đúng trạng thái công việc." },
  { icon: "📣", title: "Social media team", body: "Quản lý Facebook Pages, caption, lịch đăng, publishing queue, analytics và comment workflow." },
  { icon: "📊", title: "Ban quản trị", body: "Có dashboard, phân quyền, audit và góc nhìn vận hành để ra quyết định dựa trên dữ liệu." },
];

const scenarios = [
  ["Scale content network", "Mở rộng nhiều website tin tức/review/travel với cấu trúc quản trị thống nhất."],
  ["AI-assisted editorial", "Dùng AI để tăng tốc nghiên cứu và bản nháp, nhưng vẫn giữ bước duyệt bởi con người."],
  ["Social distribution", "Đưa nội dung từ website sang Facebook Pages và theo dõi phản hồi từ cộng đồng."],
  ["Governance", "Quản lý người dùng, quyền truy cập, token tích hợp và lịch sử hoạt động."],
];

export default function Page(){return <PublicLayout>
  <section className="bg-[radial-gradient(circle_at_20%_10%,#ccfbf1,transparent_30%),linear-gradient(180deg,#fff,#f8fafc)] px-4 py-20 sm:px-6 lg:px-8"><SectionHeader eyebrow="Solutions" title="Giải pháp theo nhu cầu vận hành">GFVGO phù hợp các tổ chức cần quản lý nội dung, SEO và social theo quy trình thay vì làm rời rạc.</SectionHeader><div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">{solutions.map((s)=><FeatureCard key={s.title} title={s.title} icon={s.icon}>{s.body}</FeatureCard>)}</div></section>
  <section className="px-4 py-20 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]"><div className="rounded-[2rem] bg-slate-950 p-8 text-white"><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Use cases</p><h2 className="mt-3 text-3xl font-black">Từ content network đến social growth</h2><p className="mt-4 text-slate-300">GFVGO được định hướng cho các mô hình cần sản xuất nội dung đều, quản lý nhiều kênh và có dữ liệu để tối ưu.</p></div><div className="grid gap-4 sm:grid-cols-2">{scenarios.map(([title, body],i)=><div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 font-black text-indigo-700">{i+1}</div><p className="mt-4 font-bold text-slate-950">{title}</p><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></div>)}</div></div></section>
  <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8"><SectionHeader eyebrow="Implementation" title="Triển khai theo từng giai đoạn">Bắt đầu từ public website và legal readiness, sau đó mở rộng theo module CMS, SEO, AI content và social automation.</SectionHeader><div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-4">{["Public site", "CMS setup", "SEO workflow", "Social automation"].map((x,i)=><div key={x} className="rounded-3xl bg-white p-6 text-center shadow-sm"><p className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white">{i+1}</p><p className="mt-4 font-bold text-slate-950">{x}</p></div>)}</div></section>
</PublicLayout>}
