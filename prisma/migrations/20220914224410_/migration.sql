/*
  Warnings:

  - Made the column `borrowUpperThreshold` on table `EulerIRNotification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `borrowLowerThreshold` on table `EulerIRNotification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `supplyUpperThreshold` on table `EulerIRNotification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `supplyLowerThreshold` on table `EulerIRNotification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "EulerIRNotification" ALTER COLUMN "borrowUpperThreshold" SET NOT NULL,
ALTER COLUMN "borrowLowerThreshold" SET NOT NULL,
ALTER COLUMN "supplyUpperThreshold" SET NOT NULL,
ALTER COLUMN "supplyLowerThreshold" SET NOT NULL;
