-- Review Queue + Publish Scheduler (Phase 4B)
-- Adds explicit draft review/schedule status and links SourceArticle to generated draft posts.

ALTER TYPE "SourceArticleStatus" ADD VALUE IF NOT EXISTS 'DRAFT_CREATED';
ALTER TYPE "SourceArticleStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';

ALTER TABLE "SourceArticle" ADD COLUMN IF NOT EXISTS "draftPostId" TEXT;
ALTER TABLE "SourceArticle" ADD COLUMN IF NOT EXISTS "contentPlanItemId" TEXT;
ALTER TABLE "SourceArticle" ADD COLUMN IF NOT EXISTS "scheduledPublishAt" TIMESTAMP(3);
ALTER TABLE "SourceArticle" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "SourceArticle" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

CREATE INDEX IF NOT EXISTS "SourceArticle_draftPostId_idx" ON "SourceArticle"("draftPostId");
CREATE INDEX IF NOT EXISTS "SourceArticle_contentPlanItemId_idx" ON "SourceArticle"("contentPlanItemId");
