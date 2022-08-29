/*
  Warnings:

  - Added the required column `tokenId` to the `EulerToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EulerToken" ADD COLUMN     "tokenId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "EulerToken" ADD CONSTRAINT "EulerToken_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
