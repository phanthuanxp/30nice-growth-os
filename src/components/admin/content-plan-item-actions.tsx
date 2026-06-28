"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateDraftForContentPlanItemAction } from "@/server/actions/generate-plan-drafts";

interface Props {
  itemId: string;
  tenantId: string;
  postId?: string | null;
  postStatus?: string | null;
}

export function ContentPlanItemActions({ itemId, tenantId, postId, postStatus }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      await generateDraftForContentPlanItemAction(itemId, new FormData());
      router.refresh();
    });
  };

  if (postId) {
    return (
      <Link href={`/admin/sites/${tenantId}/blog/${postId}`}>
        <Button size="sm" variant="outline">
          <ExternalLink className="h-3.5 w-3.5" />
          {postStatus === "PUBLISHED" ? "Đã publish" : "Mở draft"}
        </Button>
      </Link>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={handleGenerate} loading={pending} disabled={pending}>
      <Brain className="h-3.5 w-3.5" />
      {pending ? "Đang viết..." : "Tạo bài"}
    </Button>
  );
}
