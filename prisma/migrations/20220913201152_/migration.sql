/*
  Warnings:

  - Added the required column `totalBorrowsUSD` to the `EulerToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EulerToken" ADD COLUMN     "totalBorrowsUSD" TEXT NOT NULL;
