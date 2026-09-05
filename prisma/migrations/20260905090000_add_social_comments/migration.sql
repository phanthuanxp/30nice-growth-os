-- Social Growth OS Phase E: store the comments that arrive on Page posts via the
-- feed webhook, so the events collected since Phase C stop piling up unprocessed.

CREATE TABLE "SocialComment" (
  "id" TEXT NOT NULL,
  "externalCommentId" TEXT NOT NULL,
  "externalPostId" TEXT NOT NULL,
  "publishTargetId" TEXT,
  "socialPageId" TEXT,
  "parentCommentId" TEXT,
  "authorId" TEXT,
  "authorName" TEXT,
  "message" TEXT,
  "isFromPage" BOOLEAN NOT NULL DEFAULT false,
  "postedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialComment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialComment_externalCommentId_key"
  ON "SocialComment"("externalCommentId");

CREATE INDEX "SocialComment_socialPageId_postedAt_idx"
  ON "SocialComment"("socialPageId", "postedAt");

CREATE INDEX "SocialComment_publishTargetId_postedAt_idx"
  ON "SocialComment"("publishTargetId", "postedAt");

CREATE INDEX "SocialComment_externalPostId_idx"
  ON "SocialComment"("externalPostId");

-- A deleted post or target must not take its comment history's integrity with
-- it, so the links are nullable and cleared rather than cascading.
ALTER TABLE "SocialComment"
  ADD CONSTRAINT "SocialComment_publishTargetId_fkey"
  FOREIGN KEY ("publishTargetId") REFERENCES "SocialPublishTarget"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialComment"
  ADD CONSTRAINT "SocialComment_socialPageId_fkey"
  FOREIGN KEY ("socialPageId") REFERENCES "SocialPage"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- The processor claims a batch before working it, the same way the publisher
-- locks publish targets.
ALTER TABLE "SocialWebhookEvent"
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "errorMessage" TEXT;
