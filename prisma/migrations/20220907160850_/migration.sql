/*
  Warnings:

  - Added the required column `subAccountId` to the `EulerHealthNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subAccountId` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EulerHealthNotification" ADD COLUMN     "subAccountId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EulerIRNotification" ADD COLUMN     "subAccountId" TEXT NOT NULL;
