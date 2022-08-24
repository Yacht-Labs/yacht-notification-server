-- AlterTable
ALTER TABLE "EulerHealthNotification" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "EulerIRNotification" ALTER COLUMN "isActive" SET DEFAULT true;
