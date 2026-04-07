-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "CustomFieldEntityType" AS ENUM ('DEAL', 'CONTACT', 'COMPANY', 'LEAD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable: add entityType to CustomField
ALTER TABLE "CustomField" ADD COLUMN IF NOT EXISTS "entityType" "CustomFieldEntityType" NOT NULL DEFAULT 'DEAL';

-- AlterTable: add customFieldValues to Contact
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "customFieldValues" JSONB;

-- AlterTable: add customFieldValues to Company
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "customFieldValues" JSONB;

-- AlterTable: add customFieldValues to Lead
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "customFieldValues" JSONB;
