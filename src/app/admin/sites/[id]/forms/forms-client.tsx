"use client";

import { useState, useTransition } from "react";
import {
  Send, Check, Loader2, X, Eye, EyeOff, AlertCircle,
  MessageCircle, Mail, Bell, BellOff, Clock, User, Phone,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveFormNotifications, testTelegramNotification, testZaloNotification } from "./actions";
import type { NotificationConfig } from "@/lib/notifications";

/* ── helpers ──────────────────────────────────────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors shrink-0",
          enabled ? "bg-indigo-600" : "bg-slate-200"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
          enabled && "translate-x-4"
        )} />
      </button>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  sourcePath: string | null;
}

interface Props {
  siteId: string;
  config: NotificationConfig | null;
  recentLeads: Lead[];
}

/* ── Telegram panel ────────────────────────────────────── */

function TelegramPanel({ siteId, init }: {
  siteId: string;
  init: NotificationConfig["telegram"];
}) {
  const [enabled, setEnabled] = useState(init?.enabled ?? false);
  const [botToken, setBotToken] = useState(init?.botToken ?? "");
  const [chatId, setChatId] = useState(init?.chatId ?? "");
  const [showToken, setShowToken] = useState(false);
  const [testing, startTest] = useTransition();
  const [testResult, setTestResult] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [expanded, setExpanded] = useState(!init?.botToken);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button type="button" className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Send className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-slate-800">Telegram Bot</p>
          <p className="text-xs text-slate-400">Nhận thông báo lead qua Telegram bot</p>
        </div>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
          enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
          {enabled ? "Bật" : "Tắt"}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          <Toggle enabled={enabled} onChange={setEnabled} label="Kích hoạt thông báo Telegram" />

          <div className="space-y-3">
            <Field
              label="Bot Token"
              hint="Lấy từ @BotFather trên Telegram. Tạo bot mới → /newbot → copy token"
            >
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={botToken}
                  onChange={e => setBotToken(e.target.value)}
                  placeholder="1234567890:AAF..."
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 pr-9 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="button" onClick={() => setShowToken(s => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field
              label="Chat ID"
              hint="Chat ID của bạn hoặc group. Gửi /start cho @userinfobot để lấy ID cá nhân, hoặc thêm bot vào group rồi gửi /chatid"
            >
              <input
                type="text"
                value={chatId}
                onChange={e => setChatId(e.target.value)}
                placeholder="-1001234567890"
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>
          </div>

          {/* Setup guide */}
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Hướng dẫn nhanh:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
              <li>Mở Telegram → tìm <strong>@BotFather</strong> → gửi <code>/newbot</code></li>
              <li>Đặt tên bot → copy <strong>Bot Token</strong> dán vào đây</li>
              <li>Gửi <code>/start</code> cho bot của bạn</li>
              <li>Tìm <strong>@userinfobot</strong> → lấy <strong>Chat ID</strong></li>
              <li>Nhấn &ldquo;Test&rdquo; để kiểm tra</li>
            </ol>
          </div>

          {testResult && (
            <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
              {testResult.ok ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {testResult.ok ? "Gửi test thành công! Kiểm tra Telegram của bạn." : `Lỗi: ${testResult.error}`}
            </div>
          )}

          <button type="button" disabled={!botToken || !chatId || testing}
            onClick={() => {
              setTestResult(null);
              startTest(async () => {
                const r = await testTelegramNotification(siteId, botToken, chatId);
                setTestResult(r);
              });
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Gửi tin test
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Zalo panel ────────────────────────────────────────── */

function ZaloPanel({ siteId, init }: { siteId: string; init: NotificationConfig["zalo"] }) {
  const [enabled, setEnabled] = useState(init?.enabled ?? false);
  const [webhookUrl, setWebhookUrl] = useState(init?.webhookUrl ?? "");
  const [testing, startTest] = useTransition();
  const [testResult, setTestResult] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [expanded, setExpanded] = useState(!init?.webhookUrl);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button type="button" className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <MessageCircle className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-slate-800">Zalo Webhook</p>
          <p className="text-xs text-slate-400">Nhận thông báo qua Zalo OA webhook</p>
        </div>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
          enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
          {enabled ? "Bật" : "Tắt"}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          <Toggle enabled={enabled} onChange={setEnabled} label="Kích hoạt thông báo Zalo" />

          <Field
            label="Webhook URL"
            hint="URL webhook từ Zalo OA hoặc dịch vụ trung gian như n8n, Make, Zapier"
          >
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>

          {testResult && (
            <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
              {testResult.ok ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {testResult.ok ? "Webhook test thành công!" : `Lỗi: ${testResult.error}`}
            </div>
          )}

          <button type="button" disabled={!webhookUrl || testing}
            onClick={() => {
              setTestResult(null);
              startTest(async () => {
                const r = await testZaloNotification(siteId, webhookUrl);
                setTestResult(r);
              });
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Gửi test
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Email panel ───────────────────────────────────────── */

function EmailPanel({ init }: { init: NotificationConfig["email"] }) {
  const [enabled, setEnabled] = useState(init?.enabled ?? false);
  const [recipients, setRecipients] = useState((init?.recipients ?? []).join(", "));
  const [expanded, setExpanded] = useState(!init?.recipients?.length);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button type="button" className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
          <Mail className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-slate-800">Email</p>
          <p className="text-xs text-slate-400">Gửi email thông báo khi có lead mới</p>
        </div>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
          enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
          {enabled ? "Bật" : "Tắt"}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          <Toggle enabled={enabled} onChange={setEnabled} label="Kích hoạt thông báo Email" />
          <Field label="Email nhận thông báo" hint="Nhập nhiều email cách nhau bằng dấu phẩy">
            <input
              type="text"
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              placeholder="admin@example.com, sale@example.com"
              className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700">
            Tính năng gửi email đang trong giai đoạn phát triển. Cấu hình SMTP sẽ sớm được bổ sung.
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */

export function FormsClient({ siteId, config, recentLeads }: Props) {
  const [tab, setTab] = useState<"notifications" | "leads">("notifications");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, startSave] = useTransition();

  // Mirror state from child panels — read current values
  const [tgEnabled, setTgEnabled] = useState(config?.telegram?.enabled ?? false);
  const [tgToken, setTgToken] = useState(config?.telegram?.botToken ?? "");
  const [tgChatId, setTgChatId] = useState(config?.telegram?.chatId ?? "");
  const [zaloEnabled, setZaloEnabled] = useState(config?.zalo?.enabled ?? false);
  const [zaloUrl, setZaloUrl] = useState(config?.zalo?.webhookUrl ?? "");
  const [emailEnabled, setEmailEnabled] = useState(config?.email?.enabled ?? false);
  const [emailList, setEmailList] = useState((config?.email?.recipients ?? []).join(", "));

  const handleSave = () => {
    setSaved(false); setSaveError("");
    const cfg: NotificationConfig = {
      telegram: { enabled: tgEnabled, botToken: tgToken, chatId: tgChatId },
      zalo: { enabled: zaloEnabled, webhookUrl: zaloUrl },
      email: { enabled: emailEnabled, recipients: emailList.split(",").map(s => s.trim()).filter(Boolean) },
    };
    startSave(async () => {
      const r = await saveFormNotifications(siteId, cfg);
      if (r.error) setSaveError(r.error);
      else setSaved(true);
    });
  };

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; class: string }> = {
      NEW: { label: "Mới", class: "bg-blue-100 text-blue-700" },
      CONTACTED: { label: "Đã liên hệ", class: "bg-yellow-100 text-yellow-700" },
      QUALIFIED: { label: "Tiềm năng", class: "bg-green-100 text-green-700" },
      LOST: { label: "Mất", class: "bg-slate-100 text-slate-500" },
      WON: { label: "Thành công", class: "bg-emerald-100 text-emerald-700" },
    };
    return map[s] ?? { label: s, class: "bg-slate-100 text-slate-500" };
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {([
          { id: "notifications", label: "Cấu hình thông báo", icon: Bell },
          { id: "leads", label: `Leads (${recentLeads.length})`, icon: User },
        ] as const).map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              tab === t.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50")}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Notifications tab ── */}
      {tab === "notifications" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Tổng leads", value: recentLeads.length.toString(), icon: User, color: "indigo" },
              { label: "Leads mới", value: recentLeads.filter(l => l.status === "NEW").length.toString(), icon: Bell, color: "blue" },
              { label: "Kênh bật", value: [tgEnabled, zaloEnabled, emailEnabled].filter(Boolean).length + "/3", icon: BellOff, color: "green" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className={`h-7 w-7 rounded-lg mb-2 flex items-center justify-center bg-${color}-50`}>
                  <Icon className={`h-3.5 w-3.5 text-${color}-600`} />
                </div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Telegram */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button type="button" className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
              onClick={() => {}}>
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Send className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-800">Telegram Bot</p>
                <p className="text-xs text-slate-400">Nhận thông báo lead qua Telegram</p>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                tgEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                {tgEnabled ? "Bật" : "Tắt"}
              </span>
            </button>
            <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-medium">Kích hoạt</span>
                <button type="button" onClick={() => setTgEnabled(e => !e)}
                  className={cn("relative w-9 h-5 rounded-full transition-colors", tgEnabled ? "bg-indigo-600" : "bg-slate-200")}>
                  <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform", tgEnabled && "translate-x-4")} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bot Token</label>
                  <div className="relative">
                    <input type="password" value={tgToken} onChange={e => setTgToken(e.target.value)}
                      placeholder="1234567890:AAF..."
                      className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Tạo bot tại @BotFather → /newbot → copy token</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Chat ID</label>
                  <input type="text" value={tgChatId} onChange={e => setTgChatId(e.target.value)}
                    placeholder="-1001234567890"
                    className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <p className="text-[11px] text-slate-400 mt-1">Gửi /start cho @userinfobot để lấy Chat ID cá nhân</p>
                </div>
              </div>
              <TelegramTestButton siteId={siteId} botToken={tgToken} chatId={tgChatId} />
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 space-y-0.5">
                <p className="font-semibold mb-1">Hướng dẫn:</p>
                <p>1. Telegram → @BotFather → <code>/newbot</code> → copy <strong>Token</strong></p>
                <p>2. Gửi <code>/start</code> cho bot vừa tạo</p>
                <p>3. @userinfobot → lấy <strong>Chat ID</strong> của bạn</p>
                <p>4. Nhấn &ldquo;Test&rdquo; → kiểm tra nhận được tin không</p>
              </div>
            </div>
          </div>

          {/* Zalo */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <MessageCircle className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Zalo Webhook</p>
                <p className="text-xs text-slate-400">Nhận thông báo qua Zalo OA webhook</p>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                zaloEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                {zaloEnabled ? "Bật" : "Tắt"}
              </span>
            </div>
            <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-medium">Kích hoạt</span>
                <button type="button" onClick={() => setZaloEnabled(e => !e)}
                  className={cn("relative w-9 h-5 rounded-full transition-colors", zaloEnabled ? "bg-indigo-600" : "bg-slate-200")}>
                  <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform", zaloEnabled && "translate-x-4")} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Webhook URL</label>
                <input type="url" value={zaloUrl} onChange={e => setZaloUrl(e.target.value)}
                  placeholder="https://hook.n8n.cloud/..."
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <p className="text-[11px] text-slate-400 mt-1">Webhook URL từ Zalo OA, n8n, Make hoặc Zapier</p>
              </div>
              <ZaloTestButton siteId={siteId} webhookUrl={zaloUrl} />
            </div>
          </div>

          {/* Email */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Email thông báo</p>
                <p className="text-xs text-slate-400">Gửi email khi có lead mới</p>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                emailEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                {emailEnabled ? "Bật" : "Tắt"}
              </span>
            </div>
            <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-medium">Kích hoạt</span>
                <button type="button" onClick={() => setEmailEnabled(e => !e)}
                  className={cn("relative w-9 h-5 rounded-full transition-colors", emailEnabled ? "bg-indigo-600" : "bg-slate-200")}>
                  <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform", emailEnabled && "translate-x-4")} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Danh sách email nhận</label>
                <input type="text" value={emailList} onChange={e => setEmailList(e.target.value)}
                  placeholder="admin@example.com, sale@example.com"
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <p className="text-[11px] text-slate-400 mt-1">Cách nhau bằng dấu phẩy. Cấu hình SMTP trong System Settings.</p>
              </div>
            </div>
          </div>

          {/* Save bar */}
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
            <div>
              {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium"><Check className="h-4 w-4" />Đã lưu!</span>}
              {saveError && <span className="text-sm text-red-600">{saveError}</span>}
            </div>
            <button type="button" onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Lưu cài đặt
            </button>
          </div>
        </>
      )}

      {/* ── Leads tab ── */}
      {tab === "leads" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {recentLeads.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3 text-slate-400">
              <Phone className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">Chưa có lead nào</p>
              <p className="text-xs">Khi khách điền form đặt xe, lead sẽ xuất hiện ở đây</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Khách hàng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nội dung</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map(lead => {
                  const s = statusLabel(lead.status);
                  return (
                    <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                            {lead.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{lead.name}</p>
                            <p className="text-xs text-slate-400">{lead.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500 max-w-xs truncate">{lead.message ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", s.class)}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {new Date(lead.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inline test buttons (to avoid prop drilling) ─────── */

function TelegramTestButton({ siteId, botToken, chatId }: { siteId: string; botToken: string; chatId: string }) {
  const [testing, startTest] = useTransition();
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);
  return (
    <div className="space-y-2">
      {result && (
        <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
          result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
          {result.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {result.ok ? "Test thành công! Kiểm tra Telegram." : `Lỗi: ${result.error}`}
        </div>
      )}
      <button type="button" disabled={!botToken || !chatId || testing}
        onClick={() => { setResult(null); startTest(async () => setResult(await testTelegramNotification(siteId, botToken, chatId))); }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
        {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        Gửi tin nhắn test
      </button>
    </div>
  );
}

function ZaloTestButton({ siteId, webhookUrl }: { siteId: string; webhookUrl: string }) {
  const [testing, startTest] = useTransition();
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);
  return (
    <div className="space-y-2">
      {result && (
        <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
          result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
          {result.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {result.ok ? "Webhook test thành công!" : `Lỗi: ${result.error}`}
        </div>
      )}
      <button type="button" disabled={!webhookUrl || testing}
        onClick={() => { setResult(null); startTest(async () => setResult(await testZaloNotification(siteId, webhookUrl))); }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
        {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        Gửi test webhook
      </button>
    </div>
  );
}
