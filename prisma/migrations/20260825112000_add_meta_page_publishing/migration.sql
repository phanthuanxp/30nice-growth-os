-- Social Growth OS Phase C: Meta OAuth sessions, idempotent Page publishing,
-- basic post insights, and signed webhook event storage.

ALTER TABLE "SocialPublishTarget"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "lockToken" TEXT,
  ADD COLUMN "permanentFailure" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "externalPostUrl" TEXT,
  ADD COLUMN "responseMetadata" JSONB;

UPDATE "SocialPublishTarget"
SET "idempotencyKey" = 'legacy:' || "id"
WHERE "idempotencyKey" IS NULL;

ALTER TABLE "SocialPublishTarget"
  ALTER COLUMN "idempotencyKey" SET NOT NULL;

CREATE UNIQUE INDEX "SocialPublishTarget_idempotencyKey_key"
  ON "SocialPublishTarget"("idempotencyKey");

CREATE INDEX "SocialPublishTarget_status_scheduledAt_nextAttemptAt_idx"
  ON "SocialPublishTarget"("status", "scheduledAt", "nextAttemptAt");

CREATE TABLE "MetaOAuthSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "socialPageId" TEXT NOT NULL,
  "availablePages" JSONB NOT NULL,
  "encryptedPageTokens" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MetaOAuthSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MetaOAuthSession_userId_expiresAt_idx"
  ON "MetaOAuthSession"("userId", "expiresAt");

CREATE INDEX "MetaOAuthSession_socialPageId_expiresAt_idx"
  ON "MetaOAuthSession"("socialPageId", "expiresAt");

ALTER TABLE "MetaOAuthSession"
  ADD CONSTRAINT "MetaOAuthSession_socialPageId_fkey"
  FOREIGN KEY ("socialPageId") REFERENCES "SocialPage"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SocialPostInsight" (
  "id" TEXT NOT NULL,
  "publishTargetId" TEXT NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "reach" INTEGER NOT NULL DEFAULT 0,
  "engagements" INTEGER NOT NULL DEFAULT 0,
  "reactions" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "rawMetrics" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialPostInsight_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialPostInsight_publishTargetId_key"
  ON "SocialPostInsight"("publishTargetId");

CREATE INDEX "SocialPostInsight_capturedAt_idx"
  ON "SocialPostInsight"("capturedAt");

ALTER TABLE "SocialPostInsight"
  ADD CONSTRAINT "SocialPostInsight_publishTargetId_fkey"
  FOREIGN KEY ("publishTargetId") REFERENCES "SocialPublishTarget"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SocialWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventHash" TEXT NOT NULL,
  "externalPageId" TEXT,
  "field" TEXT,
  "payload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialWebhookEvent_eventHash_key"
  ON "SocialWebhookEvent"("eventHash");

CREATE INDEX "SocialWebhookEvent_externalPageId_createdAt_idx"
  ON "SocialWebhookEvent"("externalPageId", "createdAt");

CREATE INDEX "SocialWebhookEvent_processedAt_createdAt_idx"
  ON "SocialWebhookEvent"("processedAt", "createdAt");
