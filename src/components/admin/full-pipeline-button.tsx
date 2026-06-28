"use client";

import { useState, useTransition } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runFullPipelineForSourceAction, type PipelineResult } from "@/server/actions/content-sources";

export function FullPipelineButton({ sourceId }: { sourceId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PipelineResult | null>(null);

  const handleRun = () => {
    setResult(null);
    startTransition(async () => {
      const res = await runFullPipelineForSourceAction(sourceId);
      setResult(res);
    });
  };

  return (
    <div>
      <Button size="sm" variant="default" onClick={handleRun} loading={pending} disabled={pending}>
        <Zap className="h-3.5 w-3.5" />
        {pending ? "Đang chạy pipeline..." : "Full Pipeline"}
      </Button>
      {result && (
        <p className="text-xs mt-1 text-slate-600">
          {result.ok
            ? `✓ Discovered ${result.discovered} · Extracted ${result.extracted} · Rewrote ${result.rewrote}${result.failed > 0 ? ` · Failed ${result.failed}` : ""}`
            : `✗ ${result.error}`}
        </p>
      )}
    </div>
  );
}
