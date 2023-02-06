-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "protocols" TEXT[];
UPDATE "Token" SET "protocols" = ARRAY['euler']::TEXT[];