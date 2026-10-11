-- Social Growth OS / Page Factory (Phase A)

CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK');
CREATE TYPE "SocialWorkspaceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "SocialPageStatus" AS ENUM ('PLANNING', 'SETUP', 'CONNECTED', 'PAUSED', 'ARCHIVED');
CREATE TYPE "SocialPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE "SocialContentStatus" AS ENUM ('IDEA', 'DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'SKIPPED');
CREATE TYPE "SocialPublishTargetType" AS ENUM ('PAGE', 'GROUP');
CREATE TYPE "SocialPublishStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'SCHEDULED', 'PUBLISHED', 'MANUAL_REQUIRED', 'FAILED', 'SKIPPED');
CREATE TYPE "SocialGroupMode" AS ENUM ('MANUAL_ONLY', 'API_ALLOWED', 'DISABLED');
CREATE TYPE "SocialGroupStatus" AS ENUM ('CANDIDATE', 'APPROVED', 'PAUSED', 'REJECTED');

CREATE TABLE "SocialWorkspace" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" "SocialWorkspaceStatus" NOT NULL DEFAULT 'DRAFT',
  "objective" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'vi-VN',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialWorkspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialPage" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "platform" "SocialPlatform" NOT NULL DEFAULT 'FACEBOOK',
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "externalPageId" TEXT,
  "pageUrl" TEXT,
  "status" "SocialPageStatus" NOT NULL DEFAULT 'PLANNING',
  "category" TEXT,
  "objective" TEXT,
  "targetAudience" JSONB,
  "brandVoice" JSONB,
  "contentPillars" JSONB,
  "postingRules" JSONB,
  "launchKit" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialConnection" (
  "id" TEXT NOT NULL,
  "socialPageId" TEXT NOT NULL,
  "encryptedToken" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3),
  "grantedScopes" TEXT[],
  "connectionStatus" TEXT NOT NULL DEFAULT 'CONNECTED',
  "lastValidatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialContentPlan" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "socialPageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "objective" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "SocialPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "strategy" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialContentPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialContent" (
  "id" TEXT NOT NULL,
  "planId" TEXT,
  "socialPageId" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "pillar" TEXT,
  "format" TEXT NOT NULL DEFAULT 'POST',
  "title" TEXT,
  "hook" TEXT,
  "caption" TEXT,
  "callToAction" TEXT,
  "hashtags" TEXT[],
  "mediaBrief" JSONB,
  "status" "SocialContentStatus" NOT NULL DEFAULT 'IDEA',
  "scheduledAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "approvedById" TEXT,
  "sourcePostId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialGroup" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "groupUrl" TEXT,
  "externalGroupId" TEXT,
  "status" "SocialGroupStatus" NOT NULL DEFAULT 'CANDIDATE',
  "mode" "SocialGroupMode" NOT NULL DEFAULT 'MANUAL_ONLY',
  "topics" TEXT[],
  "rules" JSONB,
  "dailyPostLimit" INTEGER NOT NULL DEFAULT 1,
  "cooldownHours" INTEGER NOT NULL DEFAULT 24,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialPublishTarget" (
  "id" TEXT NOT NULL,
  "socialContentId" TEXT NOT NULL,
  "socialPageId" TEXT NOT NULL,
  "socialGroupId" TEXT,
  "targetType" "SocialPublishTargetType" NOT NULL,
  "captionOverride" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "externalPostId" TEXT,
  "status" "SocialPublishStatus" NOT NULL DEFAULT 'DRAFT',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialPublishTarget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialWorkspace_tenantId_slug_key" ON "SocialWorkspace"("tenantId", "slug");
CREATE INDEX "SocialWorkspace_tenantId_status_idx" ON "SocialWorkspace"("tenantId", "status");
CREATE UNIQUE INDEX "SocialPage_workspaceId_slug_key" ON "SocialPage"("workspaceId", "slug");
CREATE UNIQUE INDEX "SocialPage_platform_externalPageId_key" ON "SocialPage"("platform", "externalPageId");
CREATE INDEX "SocialPage_workspaceId_status_idx" ON "SocialPage"("workspaceId", "status");
CREATE UNIQUE INDEX "SocialConnection_socialPageId_key" ON "SocialConnection"("socialPageId");
CREATE INDEX "SocialContentPlan_workspaceId_status_idx" ON "SocialContentPlan"("workspaceId", "status");
CREATE INDEX "SocialContentPlan_socialPageId_startDate_idx" ON "SocialContentPlan"("socialPageId", "startDate");
CREATE INDEX "SocialContent_socialPageId_status_scheduledAt_idx" ON "SocialContent"("socialPageId", "status", "scheduledAt");
CREATE INDEX "SocialContent_planId_idx" ON "SocialContent"("planId");
CREATE INDEX "SocialGroup_workspaceId_status_idx" ON "SocialGroup"("workspaceId", "status");
CREATE INDEX "SocialPublishTarget_socialPageId_status_scheduledAt_idx" ON "SocialPublishTarget"("socialPageId", "status", "scheduledAt");
CREATE INDEX "SocialPublishTarget_socialGroupId_status_idx" ON "SocialPublishTarget"("socialGroupId", "status");

ALTER TABLE "SocialWorkspace" ADD CONSTRAINT "SocialWorkspace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPage" ADD CONSTRAINT "SocialPage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "SocialWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialConnection" ADD CONSTRAINT "SocialConnection_socialPageId_fkey" FOREIGN KEY ("socialPageId") REFERENCES "SocialPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialContentPlan" ADD CONSTRAINT "SocialContentPlan_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "SocialWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialContentPlan" ADD CONSTRAINT "SocialContentPlan_socialPageId_fkey" FOREIGN KEY ("socialPageId") REFERENCES "SocialPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialContent" ADD CONSTRAINT "SocialContent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SocialContentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SocialContent" ADD CONSTRAINT "SocialContent_socialPageId_fkey" FOREIGN KEY ("socialPageId") REFERENCES "SocialPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialGroup" ADD CONSTRAINT "SocialGroup_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "SocialWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPublishTarget" ADD CONSTRAINT "SocialPublishTarget_socialContentId_fkey" FOREIGN KEY ("socialContentId") REFERENCES "SocialContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPublishTarget" ADD CONSTRAINT "SocialPublishTarget_socialPageId_fkey" FOREIGN KEY ("socialPageId") REFERENCES "SocialPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPublishTarget" ADD CONSTRAINT "SocialPublishTarget_socialGroupId_fkey" FOREIGN KEY ("socialGroupId") REFERENCES "SocialGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
