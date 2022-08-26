/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `EulerHealthNotification` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `EulerIRNotification` table. All the data in the column will be lost.
  - The required column `id` was added to the `Account` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `accountId` to the `EulerHealthNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `EulerIRNotification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EulerHealthNotification" DROP CONSTRAINT "EulerHealthNotification_address_fkey";

-- DropForeignKey
ALTER TABLE "EulerIRNotification" DROP CONSTRAINT "EulerIRNotification_address_fkey";

-- AlterTable
ALTER TABLE "Account" DROP CONSTRAINT "Account_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "EulerHealthNotification" DROP COLUMN "address",
ADD COLUMN     "accountId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EulerIRNotification" DROP COLUMN "address",
ADD COLUMN     "accountId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "EulerIRNotification" ADD CONSTRAINT "EulerIRNotification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EulerHealthNotification" ADD CONSTRAINT "EulerHealthNotification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
