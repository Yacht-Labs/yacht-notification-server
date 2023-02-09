/*
  Warnings:

  - Added the required column `originTime` to the `LitPkpSwap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LitPkpSwap" ADD COLUMN     "originTime" INTEGER NOT NULL;
