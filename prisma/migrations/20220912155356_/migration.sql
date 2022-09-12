-- DropForeignKey
ALTER TABLE "EulerIRNotification" DROP CONSTRAINT "EulerIRNotification_tokenAddress_fkey";

-- AddForeignKey
ALTER TABLE "EulerIRNotification" ADD CONSTRAINT "EulerIRNotification_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "EulerToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
