"use client";

import { useState, useTransition } from "react";
import { Brain, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { classifyIntentsAction, autoClusterAction } from "@/server/actions/keyword-projects";

interface Props {
  projectId: string;
  keywordCount: number;
}

export function ClusterActions({ projectId, keywordCount }: Props) {
  const [intentPending, startIntentTransition] = useTransition();
  const [clusterPending, startClusterTransition] = useTransition();
  const [intentMsg, setIntentMsg] = useState<string | null>(null);
  const [clusterMsg, setClusterMsg] = useState<string | null>(null);

  const handleClassify = () => {
    setIntentMsg(null);
    startIntentTransition(async () => {
      const result = await classifyIntentsAction(projectId);
      setIntentMsg(result.ok ? "Đã phân loại intent thành công! Tải lại trang để xem." : (result.error ?? "Lỗi"));
    });
  };

  const handleCluster = () => {
    setClusterMsg(null);
    startClusterTransition(async () => {
      const result = await autoClusterAction(projectId);
      setClusterMsg(
        result.ok ? "Đã tạo clusters thành công! Tải lại trang để xem." : (result.error ?? "Lỗi"),
      );
    });
  };

  if (keywordCount === 0) return null;

  return (
    <Card className="p-4 mb-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 text-indigo-500" /> AI Analysis
      </h2>
      <div className="flex flex-wrap gap-3">
        <div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClassify}
            loading={intentPending}
            disabled={clusterPending}
          >
            <Tag className="h-3.5 w-3.5" />
            Phân loại Intent
          </Button>
          {intentMsg && (
            <p className={`text-xs mt-1 ${intentMsg.includes("thành công") ? "text-emerald-600" : "text-red-500"}`}>
              {intentMsg}
            </p>
          )}
        </div>

        <div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCluster}
            loading={clusterPending}
            disabled={intentPending}
          >
            <Brain className="h-3.5 w-3.5" />
            Auto Cluster (AI)
          </Button>
          {clusterMsg && (
            <p className={`text-xs mt-1 ${clusterMsg.includes("thành công") ? "text-emerald-600" : "text-red-500"}`}>
              {clusterMsg}
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        AI sẽ phân tích {keywordCount} từ khóa. Auto cluster sẽ xóa clusters cũ và tạo mới.
      </p>
    </Card>
  );
}
