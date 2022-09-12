/*
  Warnings:

  - You are about to drop the column `accountId` on the `EulerIRNotification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EulerIRNotification" DROP CONSTRAINT "EulerIRNotification_accountId_fkey";

-- AlterTable
ALTER TABLE "EulerIRNotification" DROP COLUMN "accountId";
