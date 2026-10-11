"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, ClipboardCopy, Send, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildGroupDistributionQueueAction,
  markGroupTargetPostedAction,
  skipGroupTargetAction,
  type GroupDistributionResult,
  type SocialGroupResult,
} from "@/server/actions/social-groups";

const initialDistribution: GroupDistributionResult = { ok: false };
const initialMark: SocialGroupResult = { ok: false };

export interface DistributionGroupOption {
  id: string;
  name: string;
  mode: string;
  topics: string[];
  dailyPostLimit: number;
  cooldownHours: number;
  allowLinks: boolean;
  allowPromotion: boolean;
  apiVerified: boolean;
}

export interface DistributionTarget {
  id: string;
  groupName: string;
  groupUrl: string | null;
  caption: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  postUrl: string | null;
  errorMessage: string | null;
}

function statusVariant(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "MANUAL_REQUIRED") return "warning" as const;
  return "neutral" as const;
}

export function GroupDistributionForm({ contentId, groups, canDistribute }: { contentId: string; groups: DistributionGroupOption[]; canDistribute: boolean }) {
  const [state, action, pending] = useActionState(buildGroupDistributionQueueAction, initialDistribution);

  if (!canDistribute) {
    return <p className="text-sm text-slate-500">Nội dung cần được duyệt trước khi phân phối vào Group.</p>;
  }
  if (groups.length === 0) {
    return <p className="text-sm text-slate-500">Workspace chưa có Group nào ở trạng thái đã duyệt.</p>;
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="contentId" value={contentId} />
      <div className="space-y-2">
        {groups.map((group) => (
          <label key={group.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm">
            <input type="checkbox" name="groupIds" value={group.id} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-800">{group.name}</span>
                <Badge variant={group.mode === "API_ALLOWED" && group.apiVerified ? "success" : "neutral"}>
                  {group.mode === "API_ALLOWED" && group.apiVerified ? "API" : "Thủ công"}
                </Badge>
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Tối đa {group.dailyPostLimit} bài/ngày · giãn {group.cooldownHours} giờ
                {!group.allowLinks && " · cấm liên kết"}
                {!group.allowPromotion && " · cấm chào bán"}
              </span>
            </span>
          </label>
        ))}
      </div>
      <Input name="spacingMinutes" type="number" min={5} max={720} label="Giãn cách giữa các Group (phút)" defaultValue="45" />
      <Button type="submit" size="sm" loading={pending} className="w-full">
        <Send className="h-3.5 w-3.5" /> Tạo caption biến thể và hàng chờ
      </Button>

      {state.error && <p className="text-xs font-medium text-red-600">{state.error}</p>}
      {state.ok && <p className="text-xs font-medium text-emerald-600">Đã đưa {state.created} Group vào hàng chờ.</p>}
      {state.skipped?.length ? (
        <ul className="space-y-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          {state.skipped.map((item) => <li key={item.group}><span className="font-medium">{item.group}:</span> {item.reason}</li>)}
        </ul>
      ) : null}
      {state.warnings?.length ? (
        <ul className="space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          {state.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      ) : null}
    </form>
  );
}

function CopyCaptionButton({ caption }: { caption: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(caption);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
      {copied ? "Đã copy" : "Copy caption"}
    </Button>
  );
}

function MarkPostedForm({ targetId }: { targetId: string }) {
  const [state, action, pending] = useActionState(markGroupTargetPostedAction, initialMark);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="targetId" value={targetId} />
      <div className="min-w-[220px] flex-1">
        <Input name="postUrl" type="url" placeholder="Dán URL bài đã đăng (tuỳ chọn)" />
      </div>
      <Button type="submit" size="sm" loading={pending}><Check className="h-3.5 w-3.5" /> Đã đăng</Button>
      {state.error && <p className="w-full text-xs font-medium text-red-600">{state.error}</p>}
    </form>
  );
}

function SkipButton({ targetId }: { targetId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(async () => {
          try {
            await skipGroupTargetAction(targetId);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không bỏ qua được");
          }
        })}
      >
        <SkipForward className="h-3.5 w-3.5" /> Bỏ qua
      </Button>
      {error && <p className="w-full text-xs font-medium text-red-600">{error}</p>}
    </>
  );
}

export function GroupDistributionTargets({ targets }: { targets: DistributionTarget[] }) {
  if (targets.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có Group nào trong hàng chờ của bài này.</p>;
  }
  return (
    <div className="space-y-3">
      {targets.map((target) => (
        <div key={target.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-slate-800">{target.groupName}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {target.publishedAt ? `Đã đăng ${target.publishedAt}` : target.scheduledAt ? `Dự kiến ${target.scheduledAt}` : "Chưa đặt lịch"}
              </p>
            </div>
            <Badge variant={statusVariant(target.status)}>{target.status}</Badge>
          </div>

          <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{target.caption}</p>

          {target.errorMessage && <p className="mt-2 text-xs font-medium text-amber-700">{target.errorMessage}</p>}
          {target.postUrl && (
            <a href={target.postUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Xem bài đã đăng
            </a>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <CopyCaptionButton caption={target.caption} />
            {target.groupUrl && (
              <a href={target.groupUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Mở Group</a>
            )}
            {target.status !== "PUBLISHED" && (
              <>
                <MarkPostedForm targetId={target.id} />
                {target.status !== "SKIPPED" && <SkipButton targetId={target.id} />}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
