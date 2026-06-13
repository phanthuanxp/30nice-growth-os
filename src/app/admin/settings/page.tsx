import type { Metadata } from "next";
import Link from "next/link";
import { Settings, Key, Bell, Download, Terminal, Brain, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Settings" };

function ConfigRow({ label, value, status }: { label: string; value: string; status?: "ok" | "missing" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-slate-100 rounded px-2 py-0.5 text-slate-700">{value}</code>
        {status && (
          <Badge variant={status === "ok" ? "success" : "danger"}>
            {status === "ok" ? "Đã cấu hình" : "Chưa có"}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const hasDb = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("password");
  const hasAi = !!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("...");
  const hasOpenAi = !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-...");
  const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_KEY";
  const hasNinerRouter = !!process.env.NINER_ROUTER_API_KEY && process.env.NINER_ROUTER_API_KEY !== "YOUR_9ROUTER_KEY";
  const hasCron = !!process.env.CRON_SECRET && process.env.CRON_SECRET !== "30nice-cron-secret-change-me";

  return (
    <div>
      <PageHeader
        title="Cài đặt hệ thống"
        description="Cấu hình kết nối, API key và thông báo."
      />

      <div className="space-y-6 max-w-3xl">

        {/* AI Provider Management shortcut */}
        <Link href="/admin/settings/ai">
          <Card className="hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Quản lý AI Providers</p>
                <p className="text-sm text-slate-500">Thêm API key, chọn provider mặc định và dự phòng qua giao diện web</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </CardContent>
          </Card>
        </Link>

        {/* Env status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-500" />
              Trạng thái môi trường (.env)
            </CardTitle>
            <CardDescription>Kiểm tra các biến môi trường quan trọng.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConfigRow label="DATABASE_URL" value={hasDb ? "postgresql://***" : "(chưa cấu hình)"} status={hasDb ? "ok" : "missing"} />
            <ConfigRow label="SESSION_SECRET" value="***" status="ok" />
            <ConfigRow label="ANTHROPIC_API_KEY" value={hasAi ? "sk-ant-***" : "(chưa cấu hình)"} status={hasAi ? "ok" : "missing"} />
            <ConfigRow label="OPENAI_API_KEY" value={hasOpenAi ? "sk-***" : "(chưa cấu hình)"} status={hasOpenAi ? "ok" : "missing"} />
            <ConfigRow label="GEMINI_API_KEY" value={hasGemini ? "AI***" : "(chưa cấu hình)"} status={hasGemini ? "ok" : "missing"} />
            <ConfigRow label="NINER_ROUTER_API_KEY" value={hasNinerRouter ? "***" : "(chưa cấu hình)"} status={hasNinerRouter ? "ok" : "missing"} />
            <ConfigRow label="CRON_SECRET" value={hasCron ? "***" : "(dùng giá trị mặc định)"} status={hasCron ? "ok" : "missing"} />
          </CardContent>
        </Card>

        {/* AI Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4 text-violet-500" />
              Cấu hình AI (Claude)
            </CardTitle>
            <CardDescription>Cần ANTHROPIC_API_KEY để dùng tính năng AI Writer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-300 space-y-1">
              <p className="text-slate-500"># Thêm vào file .env:</p>
              <p><span className="text-amber-400">ANTHROPIC_API_KEY</span>=<span className="text-emerald-400">&quot;sk-ant-api03-...&quot;</span></p>
            </div>
            <p className="text-xs text-slate-500">
              Lấy API key tại{" "}
              <span className="text-indigo-600 font-medium">console.anthropic.com</span>
              {" "}→ API Keys → Create Key.
              Model đang dùng: <code className="bg-slate-100 rounded px-1">claude-sonnet-4-6</code>
            </p>
            {hasAi ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <Badge variant="success">Đã kết nối</Badge>
                <span>AI Writer sẵn sàng tại trang SEO AI</span>
              </div>
            ) : (
              <Link href="/admin/seo-ai">
                <Button variant="outline" size="sm">Đến trang SEO AI</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* OpenAI Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4 text-emerald-500" />
              Cấu hình OpenAI (GPT)
            </CardTitle>
            <CardDescription>Dùng GPT-4o / GPT-4o-mini cho AI Writer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-300 space-y-1">
              <p className="text-slate-500"># Thêm vào file .env:</p>
              <p><span className="text-amber-400">OPENAI_API_KEY</span>=<span className="text-emerald-400">&quot;sk-proj-...&quot;</span></p>
              <p><span className="text-amber-400">OPENAI_MODEL</span>=<span className="text-emerald-400">&quot;gpt-4o-mini&quot;</span><span className="text-slate-500">  # hoặc gpt-4o</span></p>
            </div>
            <p className="text-xs text-slate-500">
              Lấy API key tại <span className="text-indigo-600 font-medium">platform.openai.com</span> → API keys.
            </p>
            {hasOpenAi
              ? <div className="flex items-center gap-2"><Badge variant="success">Đã kết nối</Badge><span className="text-sm text-emerald-700">OpenAI sẵn sàng</span></div>
              : <Badge variant="danger">Chưa cấu hình</Badge>
            }
          </CardContent>
        </Card>

        {/* Gemini Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4 text-sky-500" />
              Cấu hình Google Gemini
            </CardTitle>
            <CardDescription>Dùng Gemini 1.5 Flash / Pro cho AI Writer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-300 space-y-1">
              <p className="text-slate-500"># Thêm vào file .env:</p>
              <p><span className="text-amber-400">GEMINI_API_KEY</span>=<span className="text-emerald-400">&quot;AIza...&quot;</span></p>
              <p><span className="text-amber-400">GEMINI_MODEL</span>=<span className="text-emerald-400">&quot;gemini-1.5-flash&quot;</span><span className="text-slate-500">  # hoặc gemini-1.5-pro</span></p>
            </div>
            <p className="text-xs text-slate-500">
              Lấy API key tại <span className="text-indigo-600 font-medium">aistudio.google.com</span> → Get API key.
            </p>
            {hasGemini
              ? <div className="flex items-center gap-2"><Badge variant="success">Đã kết nối</Badge><span className="text-sm text-emerald-700">Gemini sẵn sàng</span></div>
              : <Badge variant="danger">Chưa cấu hình</Badge>
            }
          </CardContent>
        </Card>

        {/* 9Router Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4 text-orange-500" />
              Cấu hình 9Router
            </CardTitle>
            <CardDescription>Tích hợp dịch vụ AI 9Router với endpoint và model tùy chỉnh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-300 space-y-1">
              <p className="text-slate-500"># Thêm vào file .env:</p>
              <p><span className="text-amber-400">NINER_ROUTER_API_KEY</span>=<span className="text-emerald-400">&quot;your-key&quot;</span></p>
              <p><span className="text-amber-400">NINER_ROUTER_BASE_URL</span>=<span className="text-emerald-400">&quot;https://api.9router.com/v1&quot;</span></p>
              <p><span className="text-amber-400">NINER_ROUTER_MODEL</span>=<span className="text-emerald-400">&quot;default&quot;</span></p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              <p className="font-semibold mb-1">Lưu ý tích hợp 9Router</p>
              <p>Hệ thống sẽ POST đến <code className="bg-amber-100 rounded px-1">{"{NINER_ROUTER_BASE_URL}/chat"}</code> với header <code className="bg-amber-100 rounded px-1">Authorization: Bearer KEY</code>.</p>
              <p className="mt-1">Liên hệ 9Router để xác nhận endpoint và format response nếu cần cập nhật.</p>
            </div>
            {hasNinerRouter
              ? <div className="flex items-center gap-2"><Badge variant="success">Đã kết nối</Badge><span className="text-sm text-emerald-700">9Router sẵn sàng</span></div>
              : <Badge variant="danger">Chưa cấu hình</Badge>
            }
          </CardContent>
        </Card>

        {/* Notification webhook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Thông báo lead mới (Webhook)
            </CardTitle>
            <CardDescription>
              Nhận thông báo qua Zalo OA, Telegram Bot, hoặc bất kỳ webhook nào.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs space-y-2">
              <p className="font-semibold text-slate-700">Cách thiết lập:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Tạo tác vụ <strong>Thông báo lead mới</strong> trong trang Automation</li>
                <li>Nhập Webhook URL (Zapier, Make.com, n8n...)</li>
                <li>Chạy tác vụ thủ công hoặc gọi cron endpoint định kỳ</li>
              </ol>
            </div>
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-300 space-y-1">
              <p className="text-slate-500"># Payload gửi đến webhook:</p>
              <p>{"{"}</p>
              <p className="pl-4"><span className="text-amber-400">&quot;event&quot;</span>: <span className="text-emerald-400">&quot;new_leads&quot;</span>,</p>
              <p className="pl-4"><span className="text-amber-400">&quot;site&quot;</span>: <span className="text-emerald-400">&quot;Taxi Bắc Ninh&quot;</span>,</p>
              <p className="pl-4"><span className="text-amber-400">&quot;count&quot;</span>: <span className="text-sky-400">3</span>,</p>
              <p className="pl-4"><span className="text-amber-400">&quot;leads&quot;</span>: [{"{"}<span className="text-amber-400">name</span>, <span className="text-amber-400">phone</span>, <span className="text-amber-400">message</span>{"}"}...]</p>
              <p>{"}"}</p>
            </div>
            <Link href="/admin/automation">
              <Button variant="outline" size="sm">
                Thiết lập trong Automation
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Cron endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-500" />
              Cron Endpoints
            </CardTitle>
            <CardDescription>Thiết lập lịch gọi tự động với cron service (Vercel Cron, crontab...)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-300 space-y-3">
              <div>
                <p className="text-slate-500"># Tự đăng bài lên lịch (mỗi 15 phút):</p>
                <p className="text-emerald-400">curl -X POST /api/cron/publish \</p>
                <p className="text-emerald-400 pl-4">{'-H "x-cron-secret: [CRON_SECRET]"'}</p>
              </div>
              <div>
                <p className="text-slate-500"># Thông báo lead mới (mỗi 30 phút):</p>
                <p className="text-emerald-400">curl -X POST /api/cron/leads-notify \</p>
                <p className="text-emerald-400 pl-4">{'-H "x-cron-secret: [CRON_SECRET]"'}</p>
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <Input
                label="CRON_SECRET (hiện tại)"
                defaultValue={hasCron ? "***" : "30nice-cron-secret-change-me"}
                disabled
              />
              <p className="text-xs text-slate-400 mt-1">Thay đổi trong file .env và khởi động lại server.</p>
            </div>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-4 w-4 text-indigo-500" />
              Nhập dữ liệu từ WordPress
            </CardTitle>
            <CardDescription>Chuyển nội dung hiện có từ WordPress sang hệ thống này.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/import">
              <Button variant="outline" size="sm">Mở công cụ nhập dữ liệu</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Auth */}
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="text-emerald-800">Xác thực quản trị</CardTitle>
            <CardDescription className="text-emerald-700">
              Hệ thống đã dùng tài khoản quản trị lưu trong database với mật khẩu băm bcrypt. Không còn fallback demo login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-700">
              Dùng script seed hoặc chức năng Users để tạo/cập nhật SUPER_ADMIN. Không hiển thị mật khẩu trong giao diện.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
