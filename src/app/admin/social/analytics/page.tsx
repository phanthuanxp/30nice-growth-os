import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BarChart2, Lightbulb, MessageSquare, TrendingUp, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { BarChart } from "@/components/admin/charts/bar-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSocialAnalytics } from "@/server/queries/social";
import { timezoneOffsetHours } from "@/server/social/group-rules";
import {
  engagementByFormat,
  engagementByHour,
  engagementByPillar,
  suggestNextWeek,
  summarizeGroupOutcomes,
  topPosts,
  totalPerformance,
  weakestPosts,
  type DimensionStat,
} from "@/server/social/performance";

export const metadata: Metadata = { title: "Báo cáo Social" };

const DATE_OPTIONS = { timeZone: "Asia/Bangkok" } as const;

function StatTable({ rows, unit }: { rows: DimensionStat[]; unit: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-slate-400">Chưa có dữ liệu.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{unit}</TableHead>
          <TableHead>Bài</TableHead>
          <TableHead>TB tương tác</TableHead>
          <TableHead>Tỷ lệ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell className="font-medium text-slate-700">{row.key}</TableCell>
            <TableCell>{row.posts}</TableCell>
            <TableCell>{row.averageEngagement}</TableCell>
            <TableCell>{row.engagementRate === null ? "—" : `${row.engagementRate}%`}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function SocialAnalyticsPage() {
  const data = await getSocialAnalytics(30);
  const offset = timezoneOffsetHours(data.timezone, new Date());

  const totals = totalPerformance(data.samples);
  const pillars = engagementByPillar(data.samples);
  const formats = engagementByFormat(data.samples);
  const hours = engagementByHour(data.samples, offset);
  const suggestions = suggestNextWeek(data.samples, offset);
  const groupOutcomes = summarizeGroupOutcomes(data.groupTargets);
  const best = topPosts(data.samples, 5);
  const weakest = weakestPosts(data.samples, 5);

  const hourChart = [...hours]
    .sort((a, b) => Number(a.key) - Number(b.key))
    .map((hour) => ({ label: `${hour.key}h`, value: hour.averageEngagement }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo Social"
        description={`Hiệu quả ${data.days} ngày gần nhất trên các Facebook Page đã kết nối, cùng kết quả phân phối vào Group.`}
      />

      {data.truncated && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Kỳ này có {data.publishedCount} bài đã đăng, vượt giới hạn {data.sampleLimit} bài mỗi báo cáo.
            Mọi số liệu và đề xuất bên dưới chỉ tính trên {data.sampleLimit} bài gần nhất, không phải toàn bộ kỳ.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Bài đã đăng" value={totals.posts} icon={BarChart2} description={`Trong ${data.days} ngày`} />
        <StatCard title="Tổng tương tác" value={totals.engagements} icon={TrendingUp} iconColor="text-emerald-600" description={`TB ${totals.averageEngagement}/bài`} />
        <StatCard title="Tỷ lệ tương tác" value={totals.engagementRate === null ? "—" : `${totals.engagementRate}%`} icon={TrendingUp} iconColor="text-cyan-600" description="Trên số người tiếp cận" />
        <StatCard title="Bình luận nhận được" value={totals.comments} icon={MessageSquare} iconColor="text-amber-600" description="Không tính Page tự trả lời" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" />Đề xuất cho tuần sau</CardTitle>
          <CardDescription>Suy ra trực tiếp từ số liệu bên dưới. Mỗi đề xuất kèm căn cứ để anh có thể phản biện.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.headline} className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-800">{suggestion.headline}</p>
              <p className="mt-1 text-sm text-slate-600">{suggestion.detail}</p>
              <p className="mt-2 text-xs text-slate-500">Căn cứ: {suggestion.evidence}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Hiệu quả theo nhóm nội dung</CardTitle></CardHeader>
          <CardContent><StatTable rows={pillars} unit="Pillar" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Hiệu quả theo định dạng</CardTitle></CardHeader>
          <CardContent><StatTable rows={formats} unit="Định dạng" /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tương tác trung bình theo khung giờ đăng</CardTitle>
          <CardDescription>Theo múi giờ {data.timezone}.</CardDescription>
        </CardHeader>
        <CardContent><BarChart data={hourChart} height={160} /></CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bài hiệu quả nhất</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {best.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Chưa có bài nào.</p> : best.map((post) => (
              <div key={post.targetId} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{post.contentTitle}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{post.pageName} · {post.publishedAt.toLocaleDateString("vi-VN", DATE_OPTIONS)}</p>
                </div>
                <Badge variant="success">{post.engagements}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bài cần xem lại</CardTitle>
            <CardDescription>Tương tác thấp nhất trong kỳ — kiểm tra hook, hình ảnh và khung giờ.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {weakest.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Chưa có bài nào.</p> : weakest.map((post) => (
              <div key={post.targetId} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{post.contentTitle}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{post.pageName} · {post.publishedAt.toLocaleDateString("vi-VN", DATE_OPTIONS)}</p>
                </div>
                <Badge variant="neutral">{post.engagements}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-cyan-600" />Kết quả phân phối Group</CardTitle>
          <CardDescription>Group còn tồn nhiều mục chờ thủ công là nơi quy trình đang tắc.</CardDescription>
        </CardHeader>
        <CardContent>
          {groupOutcomes.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Chưa phân phối vào Group nào trong kỳ.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Đã đăng</TableHead>
                  <TableHead>Chờ thủ công</TableHead>
                  <TableHead>Lỗi</TableHead>
                  <TableHead>Bỏ qua</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupOutcomes.map((row) => (
                  <TableRow key={row.groupName}>
                    <TableCell className="font-medium text-slate-700">{row.groupName}</TableCell>
                    <TableCell>{row.published}</TableCell>
                    <TableCell>{row.manualPending > 0 ? <Badge variant="warning">{row.manualPending}</Badge> : 0}</TableCell>
                    <TableCell>{row.failed > 0 ? <Badge variant="danger">{row.failed}</Badge> : 0}</TableCell>
                    <TableCell>{row.skipped}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-amber-600" />Bình luận gần đây</CardTitle>
          <CardDescription>Đồng bộ từ webhook feed của Meta. Chỉ hiển thị bình luận của người khác, không tính Page tự trả lời.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recentComments.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Chưa nhận được bình luận nào. Cần Page đã kết nối và webhook feed hoạt động.</p>
          ) : data.recentComments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">{comment.authorName || "Người dùng Facebook"}</p>
                <span className="text-xs text-slate-400">{comment.postedAt.toLocaleString("vi-VN", DATE_OPTIONS)}</span>
              </div>
              {comment.message && <p className="mt-1 text-sm text-slate-600">{comment.message}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-500">{comment.socialPage?.name ?? "Page không xác định"}</span>
                {comment.publishTarget?.content && (
                  <Link href={`/admin/social/planner/${comment.publishTarget.content.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                    {comment.publishTarget.content.title || comment.publishTarget.content.topic}
                  </Link>
                )}
                {comment.publishTarget?.externalPostUrl && (
                  <a href={comment.publishTarget.externalPostUrl} target="_blank" rel="noreferrer" className="font-medium text-slate-500 hover:text-slate-700">Mở bài trên Facebook</a>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
