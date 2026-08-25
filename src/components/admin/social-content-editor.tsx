"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateSocialContentAction, type SocialActionResult } from "@/server/actions/social";

type EditorContent = {
  id: string;
  topic: string;
  title: string;
  hook: string;
  caption: string;
  callToAction: string;
  hashtags: string;
  format: string;
  scheduledAt: string;
  mediaConcept: string;
  visualStyle: string;
  onImageText: string;
  aspectRatio: string;
};

const initialState: SocialActionResult = { ok: false };

export function SocialContentEditor({ content }: { content: EditorContent }) {
  const [state, action, pending] = useActionState(updateSocialContentAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="contentId" value={content.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="topic" label="Chủ đề" defaultValue={content.topic} required />
        <Input name="title" label="Tiêu đề" defaultValue={content.title} required />
      </div>
      <Textarea name="hook" label="Hook mở đầu" defaultValue={content.hook} rows={3} />
      <Textarea name="caption" label="Caption hoàn chỉnh" defaultValue={content.caption} rows={12} required />
      <Textarea name="callToAction" label="Lời kêu gọi hành động" defaultValue={content.callToAction} rows={3} />
      <Input name="hashtags" label="Hashtag (cách nhau bằng dấu phẩy hoặc khoảng trắng)" defaultValue={content.hashtags} />
      <div className="grid gap-4 md:grid-cols-3">
        <Select name="format" label="Định dạng" defaultValue={content.format} options={["POST", "CAROUSEL", "REEL", "STORY"].map((value) => ({ value, label: value }))} />
        <Input name="scheduledAt" type="datetime-local" label="Ngày giờ dự kiến" defaultValue={content.scheduledAt} />
        <Select name="aspectRatio" label="Tỷ lệ ảnh/video" defaultValue={content.aspectRatio} options={["1:1", "4:5", "9:16", "16:9"].map((value) => ({ value, label: value }))} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Textarea name="mediaConcept" label="Ý tưởng hình ảnh/video" defaultValue={content.mediaConcept} rows={4} />
        <Textarea name="visualStyle" label="Phong cách hình ảnh" defaultValue={content.visualStyle} rows={4} />
      </div>
      <Input name="onImageText" label="Chữ trên ảnh" defaultValue={content.onImageText} />
      <Input name="changeNote" label="Ghi chú phiên bản" placeholder="VD: Sửa CTA và rút gọn caption" />
      <Button type="submit" loading={pending}><Save className="h-4 w-4" /> Lưu thành bản nháp mới</Button>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-emerald-600">Đã lưu. Nội dung được đưa về trạng thái bản nháp để duyệt lại.</p>}
    </form>
  );
}
