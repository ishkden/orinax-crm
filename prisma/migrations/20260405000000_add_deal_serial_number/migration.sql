-- Add sequential numeric serialNumber to Deal table
-- Existing deals are numbered 1..N ordered by createdAt (oldest = 1)
-- New deals get the next value automatically via sequence

-- Step 1: Add nullable column first
ALTER TABLE "Deal" ADD COLUMN "serialNumber" INTEGER;

-- Step 2: Create a dedicated sequence
CREATE SEQUENCE IF NOT EXISTS "Deal_serialNumber_seq";

-- Step 3: Populate existing rows ordered by creation date (oldest gets lowest number)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "Deal"
)
UPDATE "Deal" SET "serialNumber" = numbered.rn
FROM numbered
WHERE "Deal".id = numbered.id;

-- Step 4: Advance sequence past existing max so next insert continues correctly
SELECT setval('"Deal_serialNumber_seq"', COALESCE((SELECT MAX("serialNumber") FROM "Deal"), 0) + 1, false);

-- Step 5: Attach sequence as the column default
ALTER TABLE "Deal" ALTER COLUMN "serialNumber" SET DEFAULT nextval('"Deal_serialNumber_seq"');

-- Step 6: Enforce NOT NULL now that all rows have a value
ALTER TABLE "Deal" ALTER COLUMN "serialNumber" SET NOT NULL;

-- Step 7: Unique constraint (one serial number per deal globally)
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_serialNumber_key" UNIQUE ("serialNumber");

-- Step 8: Bind sequence ownership to the column (DROP CASCADE will clean it up)
ALTER SEQUENCE "Deal_serialNumber_seq" OWNED BY "Deal"."serialNumber";
