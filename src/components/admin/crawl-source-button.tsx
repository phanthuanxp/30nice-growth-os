"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { crawlContentSourceAction } from "@/server/actions/content-sources";

export function CrawlSourceButton({ sourceId, sourceType }: { sourceId: string; sourceType: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  if (!["SITEMAP", "RSS"].includes(sourceType)) return null;

  const handleCrawl = () => {
    setResult(null);
    startTransition(async () => {
      const res = await crawlContentSourceAction(sourceId);
      setResult(res);
    });
  };

  return (
    <div>
      <Button size="sm" variant="outline" onClick={handleCrawl} loading={pending} disabled={pending}>
        <RefreshCw className={`h-3 w-3 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Đang crawl..." : "Crawl now"}
      </Button>
      {result && !result.ok && <p className="text-xs text-red-600 mt-1">{result.error}</p>}
      {result?.ok && <p className="text-xs text-emerald-600 mt-1">Crawl xong! Reload để xem bài mới.</p>}
    </div>
  );
}
