/*
  Warnings:

  - You are about to drop the column `totalSupply` on the `EulerToken` table. All the data in the column will be lost.
  - Added the required column `totalSupplyUSD` to the `EulerToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EulerToken" DROP COLUMN "totalSupply",
ADD COLUMN     "totalSupplyUSD" TEXT NOT NULL;
