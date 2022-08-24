/*
  Warnings:

  - Added the required column `updatedAt` to the `EulerHealthNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EulerHealthNotification" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "EulerIRNotification" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
