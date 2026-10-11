-- Social Growth OS Phase B: content edit history

CREATE TABLE "SocialContentRevision" (
  "id" TEXT NOT NULL,
  "socialContentId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "changeNote" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialContentRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialContentRevision_socialContentId_version_key"
  ON "SocialContentRevision"("socialContentId", "version");

CREATE INDEX "SocialContentRevision_socialContentId_createdAt_idx"
  ON "SocialContentRevision"("socialContentId", "createdAt");

ALTER TABLE "SocialContentRevision"
  ADD CONSTRAINT "SocialContentRevision_socialContentId_fkey"
  FOREIGN KEY ("socialContentId") REFERENCES "SocialContent"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
