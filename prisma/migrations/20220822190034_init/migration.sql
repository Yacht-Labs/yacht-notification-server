-- CreateTable
CREATE TABLE "Addresses" (
    "pubkey" TEXT NOT NULL,
    "deviceId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Addresses_pkey" PRIMARY KEY ("pubkey")
);
