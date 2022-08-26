/*
  Warnings:

  - Added the required column `deviceId` to the `EulerHealthNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceId` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EulerHealthNotification" ADD COLUMN     "deviceId" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "EulerIRNotification" ADD COLUMN     "deviceId" VARCHAR(255) NOT NULL;
