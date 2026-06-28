"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Brain, BookOpen, Pen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateBriefAction, generateDraftAction, publishAiJobToPostAction, type AiContentResult } from "@/server/actions/ai-content";
import type { AiContentJobStatus } from "@prisma/client";

interface Props {
  jobId: string;
  tenantId: string;
  status: AiContentJobStatus;
  hasBrief: boolean;
  hasDraft: boolean;
  existingPostId?: string | null;
}

export function AiContentJobClient({ jobId, tenantId, status, hasBrief, hasDraft, existingPostId }: Props) {
  const router = useRouter();
  const [briefPending, startBriefTransition] = useTransition();
  const [draftPending, startDraftTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<AiContentResult | null>(null);

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

  const handleSaveToPost = () => {
    startSaveTransition(async () => {
      const res = await publishAiJobToPostAction(jobId, tenantId);
      setSaveResult(res);
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

        {hasDraft && !existingPostId && (
          <div>
            <Button
              size="sm"
              variant="default"
              onClick={handleSaveToPost}
              loading={savePending}
              disabled={savePending || isGenerating}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Lưu thành Post
            </Button>
            <p className="text-xs text-slate-400 mt-1">Tạo bản nháp trong Blog để chỉnh sửa & publish</p>
          </div>
        )}

        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Đang xử lý... có thể mất 30-60 giây</span>
          </div>
        )}
      </div>

      {existingPostId && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-emerald-600 font-medium">
            Draft đã được lưu thành Post.{" "}
            <a href={`/admin/sites/${tenantId}/blog/${existingPostId}`} className="underline">
              Mở trong editor
            </a>{" "}
            để chỉnh sửa và publish.
          </p>
        </div>
      )}

      {saveResult && !saveResult.ok && (
        <p className="text-xs text-red-600 mt-3">{saveResult.error}</p>
      )}
    </Card>
  );
}

