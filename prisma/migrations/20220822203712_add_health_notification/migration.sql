/*
  Warnings:

  - Added the required column `addressPubKey` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `borrowAPY` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `borrowThreshold` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isActive` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyAPY` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplyThreshold` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenAddress` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EulerIRNotification" ADD COLUMN     "addressPubKey" TEXT NOT NULL,
ADD COLUMN     "borrowAPY" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "borrowThreshold" INTEGER NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL,
ADD COLUMN     "supplyAPY" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "supplyThreshold" INTEGER NOT NULL,
ADD COLUMN     "tokenAddress" VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE "EulerHealthNotification" (
    "id" TEXT NOT NULL,
    "thresholdValue" DOUBLE PRECISION NOT NULL,
    "addressPubKey" TEXT NOT NULL,

    CONSTRAINT "EulerHealthNotification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EulerIRNotification" ADD CONSTRAINT "EulerIRNotification_addressPubKey_fkey" FOREIGN KEY ("addressPubKey") REFERENCES "Address"("pubKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EulerHealthNotification" ADD CONSTRAINT "EulerHealthNotification_addressPubKey_fkey" FOREIGN KEY ("addressPubKey") REFERENCES "Address"("pubKey") ON DELETE RESTRICT ON UPDATE CASCADE;
