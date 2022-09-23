-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "deviceId" VARCHAR(255) NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" TEXT,
    "decimals" INTEGER NOT NULL,
    "logoURI" TEXT,
    "extensions" JSONB,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EulerToken" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "supplyAPY" DOUBLE PRECISION NOT NULL,
    "borrowAPY" DOUBLE PRECISION NOT NULL,
    "borrowFactor" DOUBLE PRECISION NOT NULL,
    "collateralFactor" DOUBLE PRECISION NOT NULL,
    "totalSupplyUSD" TEXT NOT NULL,
    "totalBorrowsUSD" TEXT NOT NULL,
    "eulAPY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EulerToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EulerIRNotification" (
    "id" TEXT NOT NULL,
    "tokenAddress" VARCHAR(255) NOT NULL,
    "deviceId" VARCHAR(255) NOT NULL,
    "borrowAPY" DOUBLE PRECISION,
    "supplyAPY" DOUBLE PRECISION,
    "borrowUpperThreshold" INTEGER NOT NULL,
    "borrowLowerThreshold" INTEGER NOT NULL,
    "supplyUpperThreshold" INTEGER NOT NULL,
    "supplyLowerThreshold" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EulerIRNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "response" JSONB,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EulerHealthNotification" (
    "id" TEXT NOT NULL,
    "thresholdValue" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accountId" TEXT NOT NULL,
    "subAccountId" TEXT NOT NULL,
    "deviceId" VARCHAR(255) NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EulerHealthNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_chainId_key" ON "Token"("address", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "EulerToken_address_key" ON "EulerToken"("address");

-- AddForeignKey
ALTER TABLE "EulerToken" ADD CONSTRAINT "EulerToken_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EulerIRNotification" ADD CONSTRAINT "EulerIRNotification_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "EulerToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EulerHealthNotification" ADD CONSTRAINT "EulerHealthNotification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
