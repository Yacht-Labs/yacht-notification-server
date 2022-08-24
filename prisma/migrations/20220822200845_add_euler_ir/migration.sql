/*
  Warnings:

  - You are about to drop the `Addresses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Addresses";

-- CreateTable
CREATE TABLE "Address" (
    "deviceId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pubKey" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("pubKey")
);

-- CreateTable
CREATE TABLE "EulerIRNotification" (
    "id" TEXT NOT NULL,

    CONSTRAINT "EulerIRNotification_pkey" PRIMARY KEY ("id")
);
