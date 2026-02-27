/*
  Warnings:

  - You are about to drop the column `mentorEarnings` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `platformFee` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `referralDiscount` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `serviceFee` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `Payout` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReferralEarning` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('USER', 'PLATFORM');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('PENDING', 'RELEASED', 'REVERSED');

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_referralEarningId_fkey";

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_sessionPackageId_fkey";

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReferralEarning" DROP CONSTRAINT "ReferralEarning_referrerUserId_fkey";

-- DropForeignKey
ALTER TABLE "ReferralEarning" DROP CONSTRAINT "ReferralEarning_sessionPackageId_fkey";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "mentorEarnings",
DROP COLUMN "platformFee",
DROP COLUMN "referralDiscount",
DROP COLUMN "serviceFee";

-- DropTable
DROP TABLE "Payout";

-- DropTable
DROP TABLE "ReferralEarning";

-- DropEnum
DROP TYPE "PayoutStatus";

-- DropEnum
DROP TYPE "PayoutType";

-- DropEnum
DROP TYPE "ReferralEarningType";

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "sessionPackageId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "platformCommissionPct" INTEGER NOT NULL,
    "platformCommissionCents" INTEGER NOT NULL,
    "mentorPayoutCents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReferral" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "LedgerAccountType" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "LedgerStatus" NOT NULL,
    "stripeTransferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_sessionPackageId_key" ON "Payment"("sessionPackageId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_userId_key" ON "LedgerAccount"("userId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionPackageId_fkey" FOREIGN KEY ("sessionPackageId") REFERENCES "SessionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReferral" ADD CONSTRAINT "PaymentReferral_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReferral" ADD CONSTRAINT "PaymentReferral_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
