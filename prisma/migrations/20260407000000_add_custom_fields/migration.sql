-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('STRING', 'TEXT', 'LIST', 'DATETIME', 'DATE', 'RESOURCE', 'ADDRESS', 'URL', 'FILE', 'MONEY', 'BOOLEAN', 'NUMBER');

-- AlterTable: add customFieldValues JSON column to Deal
ALTER TABLE "Deal" ADD COLUMN "customFieldValues" JSONB;

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_code_key" ON "CustomField"("code");

-- CreateIndex
CREATE INDEX "CustomField_orgId_idx" ON "CustomField"("orgId");

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
