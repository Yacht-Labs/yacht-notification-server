/*
  Warnings:

  - You are about to drop the column `addressPubKey` on the `EulerHealthNotification` table. All the data in the column will be lost.
  - You are about to drop the column `addressPubKey` on the `EulerIRNotification` table. All the data in the column will be lost.
  - You are about to drop the column `borrowAPY` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `supplyAPY` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `address` to the `EulerHealthNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `decimals` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EulerHealthNotification" DROP CONSTRAINT "EulerHealthNotification_addressPubKey_fkey";

-- DropForeignKey
ALTER TABLE "EulerIRNotification" DROP CONSTRAINT "EulerIRNotification_addressPubKey_fkey";

-- AlterTable
ALTER TABLE "EulerHealthNotification" DROP COLUMN "addressPubKey",
ADD COLUMN     "address" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EulerIRNotification" DROP COLUMN "addressPubKey",
ADD COLUMN     "address" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Token" DROP COLUMN "borrowAPY",
DROP COLUMN "createdAt",
DROP COLUMN "supplyAPY",
DROP COLUMN "tier",
DROP COLUMN "updatedAt",
ADD COLUMN     "decimals" INTEGER NOT NULL,
ADD COLUMN     "price" TEXT NOT NULL,
ADD COLUMN     "symbol" TEXT NOT NULL;

-- DropTable
DROP TABLE "Address";

-- CreateTable
CREATE TABLE "Account" (
    "address" TEXT NOT NULL,
    "deviceId" VARCHAR(255) NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "EulerToken" (
    "address" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "supplyAPY" DOUBLE PRECISION NOT NULL,
    "borrowAPY" DOUBLE PRECISION NOT NULL,
    "borrowFactor" DOUBLE PRECISION NOT NULL,
    "collateralFactor" DOUBLE PRECISION NOT NULL,
    "eulAPY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EulerToken_pkey" PRIMARY KEY ("address")
);

-- AddForeignKey
ALTER TABLE "EulerIRNotification" ADD CONSTRAINT "EulerIRNotification_address_fkey" FOREIGN KEY ("address") REFERENCES "Account"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EulerIRNotification" ADD CONSTRAINT "EulerIRNotification_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EulerHealthNotification" ADD CONSTRAINT "EulerHealthNotification_address_fkey" FOREIGN KEY ("address") REFERENCES "Account"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
