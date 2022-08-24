/*
  Warnings:

  - The primary key for the `Addresses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `pubkey` on the `Addresses` table. All the data in the column will be lost.
  - Added the required column `pubKey` to the `Addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Addresses" DROP CONSTRAINT "Addresses_pkey",
DROP COLUMN "pubkey",
ADD COLUMN     "pubKey" TEXT NOT NULL,
ADD CONSTRAINT "Addresses_pkey" PRIMARY KEY ("pubKey");
