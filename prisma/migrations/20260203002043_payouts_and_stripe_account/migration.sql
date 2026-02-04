-- CreateEnum
CREATE TYPE "StripeConnectStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'ACTIVE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "ReferralEarningType" AS ENUM ('CLIENT_REFERRAL', 'MENTOR_REFERRAL');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('SESSION_EARNING', 'REFERRAL_BONUS');

-- AlterTable
ALTER TABLE "ReferralEarning" ADD COLUMN     "type" "ReferralEarningType" NOT NULL DEFAULT 'CLIENT_REFERRAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripeConnectStatus" "StripeConnectStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "stripeTransferId" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "type" "PayoutType" NOT NULL,
    "sessionId" TEXT,
    "referralEarningId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_referralEarningId_key" ON "Payout"("referralEarningId");

-- CreateIndex
CREATE INDEX "Payout_userId_idx" ON "Payout"("userId");

-- CreateIndex
CREATE INDEX "Payout_sessionId_idx" ON "Payout"("sessionId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_referralEarningId_fkey" FOREIGN KEY ("referralEarningId") REFERENCES "ReferralEarning"("id") ON DELETE SET NULL ON UPDATE CASCADE;
