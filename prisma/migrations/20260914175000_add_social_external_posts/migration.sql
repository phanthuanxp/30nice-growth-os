-- Phase D: store Facebook Page posts created outside GFVGO.
-- Additive only. Do not run in production until reviewed/approved.
CREATE TABLE "SocialExternalPost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "socialPageId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL DEFAULT 'FACEBOOK',
    "externalPostId" TEXT NOT NULL,
    "message" TEXT,
    "permalinkUrl" TEXT,
    "postType" TEXT,
    "mediaJson" JSONB,
    "createdTime" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "rawMetadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialExternalPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialExternalPost_socialPageId_externalPostId_key" ON "SocialExternalPost"("socialPageId", "externalPostId");
CREATE INDEX "SocialExternalPost_tenantId_createdTime_idx" ON "SocialExternalPost"("tenantId", "createdTime");
CREATE INDEX "SocialExternalPost_workspaceId_syncedAt_idx" ON "SocialExternalPost"("workspaceId", "syncedAt");
CREATE INDEX "SocialExternalPost_socialPageId_createdTime_idx" ON "SocialExternalPost"("socialPageId", "createdTime");

ALTER TABLE "SocialExternalPost" ADD CONSTRAINT "SocialExternalPost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialExternalPost" ADD CONSTRAINT "SocialExternalPost_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "SocialWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialExternalPost" ADD CONSTRAINT "SocialExternalPost_socialPageId_fkey" FOREIGN KEY ("socialPageId") REFERENCES "SocialPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
