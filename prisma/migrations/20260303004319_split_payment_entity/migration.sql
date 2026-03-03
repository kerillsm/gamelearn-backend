/*
  Warnings:

  - You are about to drop the `LedgerAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LedgerEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LedgerTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentProcessingLock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payout` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SplitRole" AS ENUM ('MENTOR', 'MENTOR_REFERRER', 'STUDENT_REFERRER', 'PLATFORM', 'STRIPE_FEE');

-- CreateEnum
CREATE TYPE "SplitStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "LedgerAccount" DROP CONSTRAINT "LedgerAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_accountId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerTransaction" DROP CONSTRAINT "LedgerTransaction_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_ledgerTransactionId_fkey";

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_userId_fkey";

-- DropTable
DROP TABLE "LedgerAccount";

-- DropTable
DROP TABLE "LedgerEntry";

-- DropTable
DROP TABLE "LedgerTransaction";

-- DropTable
DROP TABLE "PaymentProcessingLock";

-- DropTable
DROP TABLE "Payout";

-- DropEnum
DROP TYPE "LedgerAccountCategory";

-- DropEnum
DROP TYPE "LedgerDirection";

-- DropEnum
DROP TYPE "LedgerTransactionType";

-- DropEnum
DROP TYPE "PayoutStatus";

-- DropEnum
DROP TYPE "PayoutTargetType";

-- CreateTable
CREATE TABLE "PayoutSplit" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "SplitRole" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "SplitStatus" NOT NULL DEFAULT 'PENDING',
    "stripeTransferId" TEXT,

    CONSTRAINT "PayoutSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayoutSplit_stripeTransferId_key" ON "PayoutSplit"("stripeTransferId");

-- AddForeignKey
ALTER TABLE "PayoutSplit" ADD CONSTRAINT "PayoutSplit_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutSplit" ADD CONSTRAINT "PayoutSplit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
