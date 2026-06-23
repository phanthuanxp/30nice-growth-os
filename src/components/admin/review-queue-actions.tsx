"use client";

import { useActionState } from "react";
import { CalendarClock, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publishDraftFromReviewAction, rejectDraftFromReviewAction, scheduleDraftFromReviewAction } from "@/server/actions/review-queue";

export function ReviewQueueActions({ articleId }: { articleId: string }) {
  const schedule = scheduleDraftFromReviewAction.bind(null, articleId);
  const [state, formAction] = useActionState(schedule, { ok: false });
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <form action={publishDraftFromReviewAction.bind(null, articleId)}><Button size="sm" type="submit"><CheckCircle className="h-3.5 w-3.5" />Publish now</Button></form>
      <form action={formAction} className="flex items-center gap-2">
        <input name="scheduledAt" type="datetime-local" className="h-8 rounded-md border border-slate-300 px-2 text-xs" />
        <Button size="sm" variant="outline" type="submit"><CalendarClock className="h-3.5 w-3.5" />Schedule</Button>
        {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      </form>
      <form action={rejectDraftFromReviewAction.bind(null, articleId)}><Button size="sm" variant="outline" type="submit"><RotateCcw className="h-3.5 w-3.5" />Send back</Button></form>
    </div>
  );
}
