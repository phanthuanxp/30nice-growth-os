-- Social Growth OS Phase D: Group Distribution.
-- Adds per-group posting rules, an explicit API-permission verification stamp,
-- an approval trail, and the record of who completed a manual group post.

ALTER TABLE "SocialGroup"
  ADD COLUMN "allowLinks" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "allowPromotion" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "apiVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "statusReason" TEXT;

-- Groups already marked APPROVED predate the approval trail; stamp them so the
-- distribution queue does not treat them as never reviewed.
UPDATE "SocialGroup"
SET "approvedAt" = "updatedAt"
WHERE "status" = 'APPROVED' AND "approvedAt" IS NULL;

ALTER TABLE "SocialPublishTarget"
  ADD COLUMN "manualPostedById" TEXT;

-- Daily-limit and cooldown checks read a group's recent published targets.
CREATE INDEX "SocialPublishTarget_socialGroupId_publishedAt_idx"
  ON "SocialPublishTarget"("socialGroupId", "publishedAt");
