"use client";

import { useState, useTransition } from "react";
import {
  Globe, Plus, Trash2, Star, RefreshCw, CheckCircle2, Clock,
  Copy, Check, AlertTriangle, ShieldCheck, ExternalLink,
  ChevronDown, ChevronUp, Info, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addDomainAction, deleteDomainAction, setPrimaryDomainAction,
  verifyDomainAction, provisionDomainAction,
} from "@/server/actions/domains";

export interface DomainRow {
  id: string;
  host: string;
  verified: boolean;
  primary: boolean;
}

interface Props {
  tenantId: string;
  domains: DomainRow[];
  serverIp: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors ml-1"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Đã copy" : "Copy"}
    </button>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{n}</span>
      <div>
        <p className="font-semibold text-slate-800 mb-0.5">{title}</p>
        <div className="text-slate-600 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function DnsGuide({ serverIp, open, onToggle }: { serverIp: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-blue-100/60 transition-colors">
        <Info className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="text-sm font-semibold text-blue-800 flex-1">Hướng dẫn trỏ DNS về hệ thống</span>
        {open ? <ChevronUp className="h-4 w-4 text-blue-500" /> : <ChevronDown className="h-4 w-4 text-blue-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-blue-200">
          {/* IP Card */}
          <div className="mt-3 rounded-lg bg-white border border-blue-200 p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">IP Server của bạn</p>
              <code className="text-xl font-bold text-slate-800 tracking-widest">{serverIp}</code>
            </div>
            <CopyBtn text={serverIp} />
          </div>

          <div className="space-y-3 text-xs">
            <Step n={1} title="Đăng nhập quản lý tên miền">
              Vào nhà đăng ký domain (Inet.vn, PA.vn, NameCheap, GoDaddy, Cloudflare...) → tìm mục <strong>DNS Management</strong> hoặc <strong>Quản lý DNS</strong>.
            </Step>

            <Step n={2} title="Tạo bản ghi A Record">
              <div className="mt-1.5 rounded-lg border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Loại", "Tên / Host", "Giá trị / Value", "TTL"].map(h => (
                        <th key={h} className="px-3 py-1.5 text-left font-semibold text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-3 py-2"><span className="bg-green-100 text-green-700 font-bold rounded px-1.5 py-0.5">A</span></td>
                      <td className="px-3 py-2 font-mono text-slate-700">@</td>
                      <td className="px-3 py-2 font-mono font-bold text-indigo-700">{serverIp}</td>
                      <td className="px-3 py-2 text-slate-400">3600</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="px-3 py-2"><span className="bg-green-100 text-green-700 font-bold rounded px-1.5 py-0.5">A</span></td>
                      <td className="px-3 py-2 font-mono text-slate-700">www</td>
                      <td className="px-3 py-2 font-mono font-bold text-indigo-700">{serverIp}</td>
                      <td className="px-3 py-2 text-slate-400">3600</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-1.5 text-slate-500">
                <code className="bg-slate-100 px-1 rounded">@</code> = domain gốc &nbsp;|&nbsp;
                <code className="bg-slate-100 px-1 rounded">www</code> = tiền tố www
              </p>
            </Step>

            <Step n={3} title="Đợi DNS lan truyền">
              Thường <strong>5–30 phút</strong>, tối đa 24 giờ. Kiểm tra tại{" "}
              <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 underline inline-flex items-center gap-0.5">
                dnschecker.org <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </Step>

            <Step n={4} title="Thêm domain và bấm Xác thực DNS">
              Sau khi DNS cập nhật, nhập domain vào ô bên dưới → <strong>Thêm</strong> → bấm <strong>Xác thực DNS</strong>. Hệ thống tự cấp SSL (HTTPS) miễn phí qua Let&apos;s Encrypt.
            </Step>
          </div>

          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Các nhà cung cấp phổ biến</p>
            <div className="flex flex-wrap gap-1.5">
              {["Inet.vn", "PA.vn", "Mat.vn", "Viettel IDC", "VNPT", "NameCheap", "GoDaddy", "Cloudflare"].map(r => (
                <span key={r} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{r}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DomainsClient({ tenantId, domains: init, serverIp }: Props) {
  const [domains, setDomains] = useState(init);
  const [host, setHost] = useState("");
  const [guideOpen, setGuideOpen] = useState(init.length === 0);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string; forId?: string } | null>(null);
  const [provisioning, setProvisioning] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok?: boolean; error?: string }>, okText?: string, forId?: string) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      if (r.error) setMsg({ type: "error", text: r.error, forId });
      else if (okText) setMsg({ type: "ok", text: okText, forId });
    });

  const handleAdd = () => {
    const h = host.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    if (!h) return;
    run(async () => {
      const r = await addDomainAction(tenantId, h);
      if (r.ok) {
        setDomains(p => [...p, { id: `new-${Date.now()}`, host: h, verified: false, primary: p.length === 0 }]);
        setHost("");
        setGuideOpen(false);
      }
      return r;
    }, `Đã thêm ${h}. Trỏ DNS về ${serverIp} rồi bấm Xác thực.`);
  };

  const handleVerify = (d: DomainRow) =>
    run(async () => {
      const r = await verifyDomainAction(tenantId, d.id);
      if (r.ok) {
        setDomains(p => p.map(x => x.id === d.id ? { ...x, verified: true } : x));
        setProvisioning(d.id);
        setTimeout(() => setProvisioning(v => v === d.id ? null : v), 20000);
      }
      return r;
    }, `DNS xác thực! Đang cấp SSL cho ${d.host}...`, d.id);

  const handleProvision = (d: DomainRow) =>
    run(async () => {
      setProvisioning(d.id);
      const r = await provisionDomainAction(tenantId, d.id);
      setProvisioning(null);
      return r;
    }, `https://${d.host} đã live với SSL!`, d.id);

  const handlePrimary = (d: DomainRow) =>
    run(async () => {
      const r = await setPrimaryDomainAction(tenantId, d.id);
      if (r.ok) setDomains(p => p.map(x => ({ ...x, primary: x.id === d.id })));
      return r;
    }, `${d.host} là domain chính`);

  const handleDelete = (d: DomainRow) => {
    if (!confirm(`Xóa domain ${d.host}?`)) return;
    run(async () => {
      const r = await deleteDomainAction(tenantId, d.id);
      if (r.ok) setDomains(p => p.filter(x => x.id !== d.id));
      return r;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Globe className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Domain Manager</h3>
          <p className="text-xs text-slate-400">Trỏ tên miền và cấp SSL tự động — site live ngay lập tức</p>
        </div>
      </div>

      <DnsGuide serverIp={serverIp} open={guideOpen} onToggle={() => setGuideOpen(o => !o)} />

      {/* Add input */}
      <div className="flex gap-2">
        <input
          value={host}
          onChange={e => setHost(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="taxiabc.vn"
          disabled={pending}
          className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
        />
        <button type="button" disabled={pending || !host.trim()} onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          <Plus className="h-4 w-4" />
          Thêm
        </button>
      </div>

      {/* Global msg (no forId) */}
      {msg && !msg.forId && (
        <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm border",
          msg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200")}>
          {msg.type === "error" ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Domain list */}
      {domains.length === 0 ? (
        <div className="text-center py-10 rounded-xl border-2 border-dashed border-slate-200">
          <Globe className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Chưa có domain nào</p>
          <p className="text-xs text-slate-300 mt-1">Mở hướng dẫn ở trên, trỏ DNS rồi thêm domain</p>
        </div>
      ) : (
        <div className="space-y-2">
          {domains.map(d => (
            <div key={d.id} className={cn(
              "rounded-xl border p-3",
              d.primary ? "border-indigo-200 bg-indigo-50/30" : "border-slate-200 bg-white"
            )}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{d.host}</span>
                    {d.verified && (
                      <a href={`https://${d.host}`} target="_blank" rel="noopener noreferrer"
                        className="text-indigo-500 hover:text-indigo-700">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {d.primary && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center gap-1">
                        <Star className="h-3 w-3" /> PRIMARY
                      </span>
                    )}
                    {d.verified ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> DNS OK
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> PENDING
                      </span>
                    )}
                  </div>

                  {msg?.forId === d.id && (
                    <p className={cn("text-xs mt-1", msg.type === "error" ? "text-red-600" : "text-green-600")}>
                      {msg.text}
                    </p>
                  )}

                  {provisioning === d.id && (
                    <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Đang cấp chứng chỉ SSL Let&apos;s Encrypt... (1–2 phút)
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  {!d.verified && (
                    <button type="button" disabled={pending} onClick={() => handleVerify(d)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-40 transition-colors">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Xác thực DNS
                    </button>
                  )}
                  {d.verified && provisioning !== d.id && (
                    <button type="button" disabled={pending} onClick={() => handleProvision(d)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-40 transition-colors">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Cấp lại SSL
                    </button>
                  )}
                  {!d.primary && d.verified && (
                    <button type="button" title="Đặt làm domain chính" disabled={pending} onClick={() => handlePrimary(d)}
                      className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 disabled:opacity-40 transition-colors">
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" title="Xóa" disabled={pending} onClick={() => handleDelete(d)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-40 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Unverified inline tip */}
              {!d.verified && (
                <div className="mt-2.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  <p className="flex items-center gap-1 font-semibold mb-0.5">
                    <Zap className="h-3.5 w-3.5" /> Cần trỏ DNS trước:
                  </p>
                  Bản ghi <code className="bg-white border border-amber-300 px-1 rounded font-bold">A</code> của{" "}
                  <strong>{d.host}</strong> → <code className="bg-white border border-amber-300 px-1.5 rounded font-bold">{serverIp}</code>
                  <CopyBtn text={serverIp} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
