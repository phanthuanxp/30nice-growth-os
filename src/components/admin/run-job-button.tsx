"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface RunJobButtonProps {
  onRun: () => Promise<{ error?: string; message?: string }>;
}

export function RunJobButton({ onRun }: RunJobButtonProps) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleRun = () => {
    startTransition(async () => {
      const result = await onRun();
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
      } else {
        setFeedback({ ok: true, text: result.message ?? "Hoàn thành" });
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={handleRun}
      >
        <Play className="h-3.5 w-3.5" />
        Chạy
      </Button>
      {feedback && (
        <p className={`text-[10px] max-w-[100px] leading-tight ${feedback.ok ? "text-emerald-600" : "text-red-500"}`}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
