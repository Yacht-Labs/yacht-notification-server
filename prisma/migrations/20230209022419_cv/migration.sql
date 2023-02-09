/*
  Warnings:

  - Changed the type of `originTime` on the `LitPkpSwap` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "LitPkpSwap" DROP COLUMN "originTime",
ADD COLUMN     "originTime" BIGINT NOT NULL;
