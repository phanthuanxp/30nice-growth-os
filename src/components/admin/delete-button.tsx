"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  onDelete: () => Promise<{ error?: string } | void>;
  label?: string;
}

export function DeleteButton({ onDelete, label = "Xóa" }: DeleteButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      loading={pending}
      onClick={() => {
        if (!window.confirm(`Bạn chắc chắn muốn ${label.toLowerCase()}? Hành động này không thể hoàn tác.`)) return;
        startTransition(async () => {
          await onDelete();
        });
      }}
    >
      {label}
    </Button>
  );
}
