-- CreateTable
CREATE TABLE "LitPkpSwap" (
    "pkpPublicKey" TEXT NOT NULL,
    "chainAParams" JSONB NOT NULL,
    "chainBParams" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "ipfsCID" TEXT NOT NULL,

    CONSTRAINT "LitPkpSwap_pkey" PRIMARY KEY ("pkpPublicKey")
);
