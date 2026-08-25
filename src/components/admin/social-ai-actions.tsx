"use client";

import { useState, useTransition } from "react";
import { CheckCheck, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  bulkUpdateSocialPlanStatusAction,
  generateSocialPageStrategyAction,
  generateSocialPlanDraftsAction,
  type SocialActionResult,
} from "@/server/actions/social";

function ActionResult({ result }: { result: SocialActionResult | null }) {
  if (!result) return null;
  return <p className={`mt-2 text-xs font-medium ${result.ok ? "text-emerald-600" : "text-red-600"}`}>{result.ok ? "Đã hoàn thành." : result.error}</p>;
}

export function SocialStrategyAiButton({ pageId }: { pageId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SocialActionResult | null>(null);
  return (
    <div>
      <Button type="button" size="sm" loading={pending} onClick={() => startTransition(async () => setResult(await generateSocialPageStrategyAction(pageId)))}>
        <Sparkles className="h-3.5 w-3.5" /> Tạo chiến lược AI
      </Button>
      <ActionResult result={result} />
    </div>
  );
}

export function SocialPlanAiButton({ planId }: { planId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SocialActionResult | null>(null);
  return (
    <div>
      <Button type="button" size="sm" loading={pending} onClick={() => startTransition(async () => setResult(await generateSocialPlanDraftsAction(planId)))}>
        <Sparkles className="h-3.5 w-3.5" /> Viết đủ 30 bài bằng AI
      </Button>
      <ActionResult result={result} />
    </div>
  );
}

export function SocialPlanBulkActions({ planId }: { planId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={bulkUpdateSocialPlanStatusAction.bind(null, planId, "IN_REVIEW")}>
        <Button type="submit" size="sm" variant="outline"><Send className="h-3.5 w-3.5" /> Gửi duyệt tất cả</Button>
      </form>
      <form action={bulkUpdateSocialPlanStatusAction.bind(null, planId, "APPROVED")}>
        <Button type="submit" size="sm" variant="outline"><CheckCheck className="h-3.5 w-3.5" /> Duyệt tất cả</Button>
      </form>
    </div>
  );
}
