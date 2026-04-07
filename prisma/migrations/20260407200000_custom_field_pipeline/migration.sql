-- AlterTable: add pipelineId to CustomField
ALTER TABLE "CustomField" ADD COLUMN "pipelineId" TEXT;

-- CreateIndex
CREATE INDEX "CustomField_pipelineId_idx" ON "CustomField"("pipelineId");

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_pipelineId_fkey"
  FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
