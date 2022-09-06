/*
  Warnings:

  - Added the required column `totalSupply` to the `EulerToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EulerToken" ADD COLUMN     "totalSupply" INTEGER NOT NULL;
