-- Remove Lead CRM models (project refocused to pure News CMS)
-- Drop foreign key constraints first, then tables

-- FormSubmission.leadId was an unrelated string field (no FK constraint to Lead)
-- So we just need to drop the Lead-related tables

DROP TABLE IF EXISTS "LeadStatusHistory" CASCADE;
DROP TABLE IF EXISTS "LeadNote" CASCADE;
DROP TABLE IF EXISTS "LeadActivity" CASCADE;
DROP TABLE IF EXISTS "Lead" CASCADE;

-- Drop the LeadStatus enum
DROP TYPE IF EXISTS "LeadStatus";
