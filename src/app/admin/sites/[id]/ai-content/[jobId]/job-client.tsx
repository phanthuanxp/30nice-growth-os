"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Brain, Pen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateBriefAction, generateDraftAction, type AiContentResult } from "@/server/actions/ai-content";
import type { AiContentJobStatus } from "@prisma/client";

interface Props {
  jobId: string;
  tenantId: string;
  status: AiContentJobStatus;
  hasBrief: boolean;
  hasDraft: boolean;
}

export function AiContentJobClient({ jobId, tenantId, status, hasBrief, hasDraft }: Props) {
  const router = useRouter();
  const [briefPending, startBriefTransition] = useTransition();
  const [draftPending, startDraftTransition] = useTransition();

  const handleBrief = () => {
    startBriefTransition(async () => {
      const res = await generateBriefAction(jobId, tenantId);
      if (res.ok) router.refresh();
    });
  };

  const handleDraft = () => {
    startDraftTransition(async () => {
      const res = await generateDraftAction(jobId, tenantId);
      if (res.ok) router.refresh();
    });
  };

  const isGenerating = status === "GENERATING" || briefPending || draftPending;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">AI Actions</h3>
      <div className="flex flex-wrap gap-3">
        <div>
          <Button
            size="sm"
            variant={hasBrief ? "outline" : "default"}
            onClick={handleBrief}
            loading={briefPending}
            disabled={isGenerating && !briefPending}
          >
            <Brain className="h-3.5 w-3.5" />
            {hasBrief ? "Tạo lại Brief" : "Tạo Brief"}
          </Button>
          <p className="text-xs text-slate-400 mt-1">AI phân tích → outline + FAQ</p>
        </div>

        {hasBrief && (
          <div>
            <Button
              size="sm"
              variant={hasDraft ? "outline" : "default"}
              onClick={handleDraft}
              loading={draftPending}
              disabled={isGenerating && !draftPending}
            >
              <Pen className="h-3.5 w-3.5" />
              {hasDraft ? "Viết lại Draft" : "Viết Draft"}
            </Button>
            <p className="text-xs text-slate-400 mt-1">AI viết bài hoàn chỉnh theo brief</p>
          </div>
        )}

        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Đang xử lý... có thể mất 30-60 giây</span>
          </div>
        )}
      </div>

      {hasDraft && (
        <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
          Draft xong. Có thể copy HTML vào Pages hoặc Blog editor để chỉnh sửa và publish.
        </p>
      )}
    </Card>
  );
}
