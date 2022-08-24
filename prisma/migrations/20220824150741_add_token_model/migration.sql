-- CreateTable
CREATE TABLE "Token" (
    "address" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "supplyAPY" DOUBLE PRECISION NOT NULL,
    "borrowAPY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("address")
);
