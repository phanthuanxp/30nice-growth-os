-- Subdomain Factory / Travel Content Planning (Phase 2A)
-- Safe additive migration: creates new enums and tables only.

CREATE TYPE "SubdomainPlanStatus" AS ENUM ('DRAFT', 'APPROVED', 'CREATED', 'REJECTED');
CREATE TYPE "ContentPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE "ContentPlanItemStatus" AS ENUM ('PLANNED', 'DRAFTING', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'SKIPPED');

CREATE TABLE "SubdomainPlan" (
  "id" TEXT NOT NULL,
  "rootDomain" TEXT NOT NULL,
  "subdomain" TEXT NOT NULL,
  "fullDomain" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "niche" TEXT,
  "location" TEXT,
  "intent" TEXT,
  "language" TEXT NOT NULL DEFAULT 'en',
  "seoScore" INTEGER NOT NULL DEFAULT 0,
  "opportunityScore" INTEGER NOT NULL DEFAULT 0,
  "rationale" TEXT,
  "status" "SubdomainPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "keywordProjectId" TEXT,
  "tenantId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubdomainPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentPlan" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "subdomainPlanId" TEXT,
  "title" TEXT NOT NULL,
  "goal" TEXT,
  "language" TEXT NOT NULL DEFAULT 'en',
  "status" "ContentPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentPlanItem" (
  "id" TEXT NOT NULL,
  "contentPlanId" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "intent" TEXT,
  "articleType" TEXT NOT NULL DEFAULT 'travel_guide',
  "priority" INTEGER NOT NULL DEFAULT 50,
  "status" "ContentPlanItemStatus" NOT NULL DEFAULT 'PLANNED',
  "scheduledAt" TIMESTAMP(3),
  "postId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentPlanItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubdomainPlan_rootDomain_subdomain_key" ON "SubdomainPlan"("rootDomain", "subdomain");
CREATE INDEX "SubdomainPlan_status_idx" ON "SubdomainPlan"("status");
CREATE INDEX "SubdomainPlan_fullDomain_idx" ON "SubdomainPlan"("fullDomain");
CREATE INDEX "SubdomainPlan_keywordProjectId_idx" ON "SubdomainPlan"("keywordProjectId");
CREATE INDEX "SubdomainPlan_tenantId_idx" ON "SubdomainPlan"("tenantId");
CREATE INDEX "ContentPlan_tenantId_idx" ON "ContentPlan"("tenantId");
CREATE INDEX "ContentPlan_subdomainPlanId_idx" ON "ContentPlan"("subdomainPlanId");
CREATE INDEX "ContentPlan_status_idx" ON "ContentPlan"("status");
CREATE INDEX "ContentPlanItem_contentPlanId_idx" ON "ContentPlanItem"("contentPlanId");
CREATE INDEX "ContentPlanItem_status_idx" ON "ContentPlanItem"("status");
CREATE INDEX "ContentPlanItem_priority_idx" ON "ContentPlanItem"("priority");

ALTER TABLE "SubdomainPlan" ADD CONSTRAINT "SubdomainPlan_keywordProjectId_fkey" FOREIGN KEY ("keywordProjectId") REFERENCES "KeywordProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubdomainPlan" ADD CONSTRAINT "SubdomainPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_subdomainPlanId_fkey" FOREIGN KEY ("subdomainPlanId") REFERENCES "SubdomainPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentPlanItem" ADD CONSTRAINT "ContentPlanItem_contentPlanId_fkey" FOREIGN KEY ("contentPlanId") REFERENCES "ContentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
