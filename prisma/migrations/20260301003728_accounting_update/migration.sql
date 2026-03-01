/*
  Warnings:

  - The values [PENDING] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `type` on the `LedgerAccount` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `LedgerAccount` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `stripeTransferId` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `amountCents` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `mentorPayoutCents` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `platformCommissionCents` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `platformCommissionPct` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code,userId]` on the table `LedgerAccount` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `LedgerAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `LedgerAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `LedgerAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `direction` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grossAmountCents` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `percent` to the `PaymentReferral` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LedgerAccountCategory" AS ENUM ('ASSET', 'LIABILITY', 'REVENUE', 'EXPENSE', 'EQUITY');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('PAYMENT_CAPTURE', 'STRIPE_FEE', 'REFERRAL_COMMISSION', 'PAYOUT', 'REFUND', 'DISPUTE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "PayoutTargetType" AS ENUM ('MENTOR', 'REFERRER');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('CREATED', 'SUCCEEDED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED');
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_sessionPackageId_fkey";

-- DropIndex
DROP INDEX "LedgerAccount_userId_key";

-- AlterTable
ALTER TABLE "LedgerAccount" DROP COLUMN "type",
DROP COLUMN "updatedAt",
ADD COLUMN     "category" "LedgerAccountCategory" NOT NULL,
ADD COLUMN     "code" VARCHAR(64) NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LedgerEntry" DROP COLUMN "paymentId",
DROP COLUMN "status",
DROP COLUMN "stripeTransferId",
ADD COLUMN     "direction" "LedgerDirection" NOT NULL,
ADD COLUMN     "holdUntil" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "transactionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "amountCents",
DROP COLUMN "mentorPayoutCents",
DROP COLUMN "platformCommissionCents",
DROP COLUMN "platformCommissionPct",
ADD COLUMN     "grossAmountCents" INTEGER NOT NULL,
ADD COLUMN     "netAmountCents" INTEGER,
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripeFeeCents" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'CREATED';

-- AlterTable
ALTER TABLE "PaymentReferral" ADD COLUMN     "percent" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "LedgerAccountType";

-- DropEnum
DROP TYPE "LedgerStatus";

-- CreateTable
CREATE TABLE "PaymentProcessingLock" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "stripeObjectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentProcessingLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT,
    "type" "LedgerTransactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "targetType" "PayoutTargetType" NOT NULL,
    "userId" TEXT NOT NULL,
    "ledgerTransactionId" TEXT NOT NULL,
    "stripeTransferId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProcessingLock_stripeEventId_key" ON "PaymentProcessingLock"("stripeEventId");

-- CreateIndex
CREATE INDEX "PaymentProcessingLock_stripeObjectId_idx" ON "PaymentProcessingLock"("stripeObjectId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_paymentId_idx" ON "LedgerTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_type_idx" ON "LedgerTransaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_stripeTransferId_key" ON "Payout"("stripeTransferId");

-- CreateIndex
CREATE INDEX "Payout_userId_idx" ON "Payout"("userId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "LedgerAccount_category_idx" ON "LedgerAccount"("category");

-- CreateIndex
CREATE INDEX "LedgerAccount_code_idx" ON "LedgerAccount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_code_userId_key" ON "LedgerAccount"("code", "userId");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");

-- CreateIndex
CREATE INDEX "LedgerEntry_holdUntil_idx" ON "LedgerEntry"("holdUntil");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionPackageId_fkey" FOREIGN KEY ("sessionPackageId") REFERENCES "SessionPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "LedgerTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_ledgerTransactionId_fkey" FOREIGN KEY ("ledgerTransactionId") REFERENCES "LedgerTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
