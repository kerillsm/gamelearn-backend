-- DropIndex
DROP INDEX "Payout_userId_idx";

-- AlterTable
ALTER TABLE "SessionPackage" ADD COLUMN     "disputeReason" TEXT;
