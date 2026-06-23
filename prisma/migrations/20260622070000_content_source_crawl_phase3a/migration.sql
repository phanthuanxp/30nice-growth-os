-- Content Source / Crawl Engine (Phase 3A)
-- Safe additive migration: creates source/crawl tables only.

CREATE TYPE "ContentSourceType" AS ENUM ('WEBSITE', 'SITEMAP', 'RSS', 'MANUAL_URL_LIST');
CREATE TYPE "CrawlStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');
CREATE TYPE "SourceArticleStatus" AS ENUM ('DISCOVERED', 'EXTRACTED', 'READY_FOR_REWRITE', 'REWRITE_QUEUED', 'PUBLISHED', 'DUPLICATE', 'FAILED');

CREATE TABLE "ContentSource" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "name" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "sourceType" "ContentSourceType" NOT NULL DEFAULT 'WEBSITE',
  "language" TEXT NOT NULL DEFAULT 'en',
  "niche" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "crawlStatus" "CrawlStatus" NOT NULL DEFAULT 'PENDING',
  "lastCrawledAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SourceArticle" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "sourceId" TEXT,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "canonicalUrl" TEXT,
  "rawHtml" TEXT,
  "extractedText" TEXT,
  "excerpt" TEXT,
  "author" TEXT,
  "publishedAt" TIMESTAMP(3),
  "imageUrl" TEXT,
  "contentHash" TEXT,
  "language" TEXT NOT NULL DEFAULT 'en',
  "status" "SourceArticleStatus" NOT NULL DEFAULT 'DISCOVERED',
  "targetKeyword" TEXT,
  "subdomainPlanId" TEXT,
  "metadata" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SourceArticle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrawlJob" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "sourceId" TEXT,
  "status" "CrawlStatus" NOT NULL DEFAULT 'PENDING',
  "input" JSONB,
  "discovered" INTEGER NOT NULL DEFAULT 0,
  "extracted" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrawlJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentSource_tenantId_idx" ON "ContentSource"("tenantId");
CREATE INDEX "ContentSource_sourceType_idx" ON "ContentSource"("sourceType");
CREATE INDEX "ContentSource_crawlStatus_idx" ON "ContentSource"("crawlStatus");
CREATE UNIQUE INDEX "ContentSource_tenantId_baseUrl_key" ON "ContentSource"("tenantId", "baseUrl");
CREATE UNIQUE INDEX "SourceArticle_url_key" ON "SourceArticle"("url");
CREATE INDEX "SourceArticle_tenantId_idx" ON "SourceArticle"("tenantId");
CREATE INDEX "SourceArticle_sourceId_idx" ON "SourceArticle"("sourceId");
CREATE INDEX "SourceArticle_status_idx" ON "SourceArticle"("status");
CREATE INDEX "SourceArticle_contentHash_idx" ON "SourceArticle"("contentHash");
CREATE INDEX "CrawlJob_tenantId_idx" ON "CrawlJob"("tenantId");
CREATE INDEX "CrawlJob_sourceId_idx" ON "CrawlJob"("sourceId");
CREATE INDEX "CrawlJob_status_idx" ON "CrawlJob"("status");

ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SourceArticle" ADD CONSTRAINT "SourceArticle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SourceArticle" ADD CONSTRAINT "SourceArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrawlJob" ADD CONSTRAINT "CrawlJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrawlJob" ADD CONSTRAINT "CrawlJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
