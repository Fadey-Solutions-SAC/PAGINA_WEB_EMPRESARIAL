-- AlterTable
ALTER TABLE "ClientUser" ADD COLUMN IF NOT EXISTS "webServiceUrl" TEXT;
ALTER TABLE "ClientUser" ADD COLUMN IF NOT EXISTS "licenseKey" TEXT;
ALTER TABLE "ClientUser" ADD COLUMN IF NOT EXISTS "restaurantData" JSONB;

-- Backfill licenseKey for existing rows
UPDATE "ClientUser" SET "licenseKey" = "id" WHERE "licenseKey" IS NULL;

ALTER TABLE "ClientUser" ALTER COLUMN "licenseKey" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ClientUser_licenseKey_key" ON "ClientUser"("licenseKey");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "status" "PaymentStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
