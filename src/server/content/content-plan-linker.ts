import { prisma } from "@/server/db";

function scoreMatch(text: string, keyword: string) {
  const source = text.toLowerCase();
  const target = keyword.toLowerCase();
  if (!source || !target) return 0;
  if (source === target) return 100;
  if (source.includes(target) || target.includes(source)) return 80;
  const sourceWords = new Set(source.split(/[^a-z0-9]+/).filter((w) => w.length > 2));
  const targetWords = target.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  if (targetWords.length === 0) return 0;
  const hits = targetWords.filter((w) => sourceWords.has(w)).length;
  return Math.round((hits / targetWords.length) * 70);
}

export async function findBestContentPlanItem(input: {
  tenantId: string;
  keyword?: string | null;
  title?: string | null;
}) {
  const items = await prisma.contentPlanItem.findMany({
    where: {
      contentPlan: { tenantId: input.tenantId },
      status: { in: ["PLANNED", "DRAFTING", "DRAFT"] },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 100,
  });

  const source = [input.keyword, input.title].filter(Boolean).join(" ");
  let best: { id: string; score: number } | null = null;
  for (const item of items) {
    const score = Math.max(scoreMatch(source, item.keyword), scoreMatch(source, item.title));
    if (!best || score > best.score) best = { id: item.id, score };
  }
  return best && best.score >= 35 ? best.id : null;
}

export async function attachDraftToContentPlanItem(input: {
  tenantId: string;
  sourceArticleId: string;
  postId: string;
  keyword?: string | null;
  title?: string | null;
}) {
  const itemId = await findBestContentPlanItem({ tenantId: input.tenantId, keyword: input.keyword, title: input.title });
  if (!itemId) return null;
  await prisma.contentPlanItem.update({ where: { id: itemId }, data: { status: "DRAFT", postId: input.postId } });
  await prisma.sourceArticle.update({ where: { id: input.sourceArticleId }, data: { contentPlanItemId: itemId } });
  return itemId;
}
