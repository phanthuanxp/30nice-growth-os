import { prisma } from "@/server/db";
import type { SeoIntent } from "@prisma/client";

export async function listKeywords(projectId: string) {
  return prisma.keyword.findMany({
    where: { projectId },
    orderBy: [{ searchVolume: "desc" }, { text: "asc" }],
  });
}

export async function getKeyword(id: string) {
  return prisma.keyword.findUnique({ where: { id } });
}

function normalize(kw: string): string {
  return kw.toLowerCase().trim().replace(/\s+/g, " ");
}

export async function upsertKeywords(
  projectId: string,
  rows: Array<{
    text: string;
    searchVolume?: number;
    cpc?: number;
    competition?: number;
    intent?: SeoIntent;
    difficulty?: number;
  }>,
) {
  const ops = rows.map((r) => {
    const normalizedText = normalize(r.text);
    const { text, ...rest } = r;
    return prisma.keyword.upsert({
      where: { projectId_normalizedText: { projectId, normalizedText } },
      create: { projectId, text, normalizedText, ...rest },
      update: {
        searchVolume: r.searchVolume,
        cpc: r.cpc,
        competition: r.competition,
        intent: r.intent,
        difficulty: r.difficulty,
      },
    });
  });
  return prisma.$transaction(ops);
}

export async function deleteKeyword(id: string) {
  return prisma.keyword.delete({ where: { id } });
}

export async function deleteKeywordsByProject(projectId: string) {
  return prisma.keyword.deleteMany({ where: { projectId } });
}

export async function updateKeywordIntent(id: string, intent: SeoIntent) {
  return prisma.keyword.update({ where: { id }, data: { intent } });
}

export async function updateKeywordEmbedding(id: string, embedding: number[]) {
  return prisma.keyword.update({
    where: { id },
    data: { embedding: embedding as unknown as object },
  });
}

export async function getKeywordsWithoutEmbedding(projectId: string) {
  return prisma.keyword.findMany({
    where: { projectId, embedding: { equals: undefined } },
    select: { id: true, text: true },
  });
}
