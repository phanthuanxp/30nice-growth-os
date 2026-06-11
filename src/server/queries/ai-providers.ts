import { prisma } from "@/server/db";

export type AiProviderRow = {
  id: string;
  provider: string;
  label: string;
  apiKey: string | null;
  baseUrl: string | null;
  model: string | null;
  isActive: boolean;
  isDefault: boolean;
  isFallback: boolean;
  priority: number;
};

export async function getAiProviderConfigs(): Promise<AiProviderRow[]> {
  return prisma.aiProviderConfig.findMany({ orderBy: { priority: "asc" } });
}

export async function getAiProviderConfig(provider: string): Promise<AiProviderRow | null> {
  return prisma.aiProviderConfig.findUnique({ where: { provider } });
}

export async function getDefaultAiProvider(): Promise<AiProviderRow | null> {
  return prisma.aiProviderConfig.findFirst({ where: { isDefault: true, isActive: true } });
}

export async function getFallbackAiProvider(): Promise<AiProviderRow | null> {
  return prisma.aiProviderConfig.findFirst({ where: { isFallback: true, isActive: true } });
}

export async function upsertAiProviderConfig(
  provider: string,
  data: { label: string; apiKey?: string | null; baseUrl?: string | null; model?: string | null; isActive?: boolean }
): Promise<AiProviderRow> {
  return prisma.aiProviderConfig.upsert({
    where: { provider },
    create: { provider, ...data },
    update: data,
  });
}

export async function setDefaultAiProvider(provider: string): Promise<void> {
  await prisma.$transaction([
    prisma.aiProviderConfig.updateMany({ where: { isDefault: true }, data: { isDefault: false } }),
    prisma.aiProviderConfig.upsert({
      where: { provider },
      create: { provider, label: provider, isDefault: true, isActive: true },
      update: { isDefault: true, isActive: true },
    }),
  ]);
}

export async function setFallbackAiProvider(provider: string): Promise<void> {
  await prisma.$transaction([
    prisma.aiProviderConfig.updateMany({ where: { isFallback: true }, data: { isFallback: false } }),
    prisma.aiProviderConfig.upsert({
      where: { provider },
      create: { provider, label: provider, isFallback: true, isActive: true },
      update: { isFallback: true, isActive: true },
    }),
  ]);
}

export async function clearDefaultAiProvider(provider: string): Promise<void> {
  await prisma.aiProviderConfig.updateMany({ where: { provider }, data: { isDefault: false } });
}

export async function clearFallbackAiProvider(provider: string): Promise<void> {
  await prisma.aiProviderConfig.updateMany({ where: { provider }, data: { isFallback: false } });
}
