import type { Metadata } from "next";
import { PublicLayout, SectionHeader, FeatureCard } from "@/components/marketing/public-layout";
import { publicMetadata } from "@/components/marketing/seo";

export const metadata: Metadata = publicMetadata("/tinh-nang", "Tính năng GFVGO Growth Platform", "Các tính năng quản lý website, SEO, content, Facebook Pages, AI content và analytics của GFVGO Growth Platform.");

const featureGroups = [
  { icon: "🌐", title: "Multi-site CMS", body: "Quản lý nhiều website, domain, trang, bài viết, media và cấu hình site từ một hệ thống tập trung." },
  { icon: "🔎", title: "SEO planning", body: "Tổ chức keyword, content plan, brief, trạng thái triển khai và hiệu suất SEO theo từng site." },
  { icon: "✍️", title: "Content workflow", body: "Tạo, biên tập, duyệt, lên lịch và xuất bản nội dung theo quy trình rõ ràng cho đội nhóm." },
  { icon: "🤖", title: "AI content assistance", body: "Hỗ trợ nghiên cứu ý tưởng, outline, caption, biến thể nội dung và tối ưu nội dung theo ngữ cảnh." },
  { icon: "📣", title: "Facebook Page management", body: "Kết nối Page, quản lý nội dung social, lịch đăng, publish workflow, analytics và comment operations." },
  { icon: "📊", title: "Analytics & tracking", body: "Theo dõi hoạt động, hiệu suất nội dung, lượt xuất bản, dữ liệu social và tín hiệu tăng trưởng." },
  { icon: "🖼️", title: "Media library", body: "Quản lý tài nguyên media, hình ảnh, tệp tải lên và dữ liệu liên quan đến từng website/dự án." },
  { icon: "🔐", title: "Admin & permissions", body: "Đăng nhập bảo vệ, phân quyền người dùng, quản trị token/tích hợp và kiểm soát quyền truy cập." },
  { icon: "🧭", title: "Audit & governance", body: "Ghi nhận hoạt động vận hành, giúp đội ngũ kiểm soát chất lượng và trách nhiệm biên tập." },
];

const modules = [
  ["Website layer", "Sites, pages, posts, media, redirects, themes"],
  ["SEO layer", "Keywords, content plan, briefs, publishing priorities"],
  ["AI layer", "Research, draft assistance, caption variants, optimization"],
  ["Social layer", "Facebook Pages, scheduling, publishing, comments, insights"],
  ["Admin layer", "Users, permissions, settings, audit, integrations"],
];

export default function Page(){return <PublicLayout>
  <section className="bg-[radial-gradient(circle_at_top,#dbeafe,transparent_35%),linear-gradient(180deg,#fff,#f8fafc)] px-4 py-20 sm:px-6 lg:px-8">
    <SectionHeader eyebrow="Features" title="Bộ công cụ tăng trưởng nội dung tập trung">GFVGO gom các module CMS, SEO, AI content và social publishing vào cùng một hệ thống vận hành.</SectionHeader>
    <div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-3">{featureGroups.map((f)=><FeatureCard key={f.title} title={f.title} icon={f.icon}>{f.body}</FeatureCard>)}</div>
  </section>
  <section className="px-4 py-20 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-200 lg:p-12">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Architecture</p><h2 className="mt-3 text-3xl font-black">Các lớp chức năng được thiết kế để làm việc cùng nhau</h2><p className="mt-4 text-slate-300">Thay vì dùng nhiều công cụ rời rạc, GFVGO tạo một luồng dữ liệu chung từ website, nội dung, SEO, social đến analytics.</p></div><div className="grid gap-3">{modules.map(([title, body], i)=><div key={title} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sm font-black text-slate-950">{i+1}</span><div><p className="font-bold text-white">{title}</p><p className="text-sm text-slate-400">{body}</p></div></div>)}</div></div>
    </div>
  </section>
  <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8"><SectionHeader eyebrow="Operations" title="Tối ưu cho vận hành thực tế">Các tính năng được mô tả đúng phạm vi sản phẩm hiện có/đang triển khai, không thổi phồng chứng nhận hay năng lực chưa kiểm định.</SectionHeader><div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-3">{["Có quy trình duyệt nội dung", "Tách public site và admin/auth", "Sẵn sàng cho Meta App Review"].map((x,i)=><div key={x} className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-3xl">{["✅","🛡️","📘"][i]}</p><p className="mt-4 font-bold text-slate-950">{x}</p><p className="mt-2 text-sm leading-6 text-slate-600">Giúp hệ thống dễ kiểm soát, an toàn hơn khi vận hành với nhiều người dùng và tích hợp.</p></div>)}</div></section>
</PublicLayout>}
