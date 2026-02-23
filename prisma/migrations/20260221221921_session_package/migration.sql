/*
  Warnings:

  - You are about to drop the column `sessionId` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `ReferralEarning` table. All the data in the column will be lost.
  - You are about to drop the column `mentorUserId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSessionId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `venue` on the `Session` table. All the data in the column will be lost.
  - Added the required column `sessionPackageId` to the `ReferralEarning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionPackageId` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionPackageType" AS ENUM ('VIBE_CHECK', 'ONE_SESSION', 'SESSIONS_PACK');

-- CreateEnum
CREATE TYPE "SessionPackStatus" AS ENUM ('PENDING', 'PAYED', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELED');

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "ReferralEarning" DROP CONSTRAINT "ReferralEarning_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_mentorUserId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX "Payout_sessionId_idx";

-- DropIndex
DROP INDEX "ReferralEarning_sessionId_idx";

-- DropIndex
DROP INDEX "Session_mentorUserId_idx";

-- DropIndex
DROP INDEX "Session_stripeSessionId_key";

-- DropIndex
DROP INDEX "Session_userId_idx";

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "sessionId",
ADD COLUMN     "sessionPackageId" TEXT;

-- AlterTable
ALTER TABLE "ReferralEarning" DROP COLUMN "sessionId",
ADD COLUMN     "sessionPackageId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "mentorUserId",
DROP COLUMN "price",
DROP COLUMN "rejectionReason",
DROP COLUMN "stripePaymentIntentId",
DROP COLUMN "stripeSessionId",
DROP COLUMN "type",
DROP COLUMN "userId",
DROP COLUMN "venue",
ADD COLUMN     "sessionPackageId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "SessionType";

-- CreateTable
CREATE TABLE "SessionPackage" (
    "id" TEXT NOT NULL,
    "type" "SessionPackageType" NOT NULL,
    "status" "SessionPackStatus" NOT NULL DEFAULT 'PENDING',
    "duration" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "mentorId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "stripeSessionPackageId" TEXT,
    "stripePaymentIntentId" TEXT,
    "venue" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SessionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionPackage_stripeSessionPackageId_key" ON "SessionPackage"("stripeSessionPackageId");

-- CreateIndex
CREATE INDEX "SessionPackage_mentorId_idx" ON "SessionPackage"("mentorId");

-- CreateIndex
CREATE INDEX "SessionPackage_applicantId_idx" ON "SessionPackage"("applicantId");

-- CreateIndex
CREATE INDEX "Payout_sessionPackageId_idx" ON "Payout"("sessionPackageId");

-- CreateIndex
CREATE INDEX "ReferralEarning_sessionPackageId_idx" ON "ReferralEarning"("sessionPackageId");

-- CreateIndex
CREATE INDEX "Session_sessionPackageId_idx" ON "Session"("sessionPackageId");

-- AddForeignKey
ALTER TABLE "SessionPackage" ADD CONSTRAINT "SessionPackage_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPackage" ADD CONSTRAINT "SessionPackage_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_sessionPackageId_fkey" FOREIGN KEY ("sessionPackageId") REFERENCES "SessionPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEarning" ADD CONSTRAINT "ReferralEarning_sessionPackageId_fkey" FOREIGN KEY ("sessionPackageId") REFERENCES "SessionPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_sessionPackageId_fkey" FOREIGN KEY ("sessionPackageId") REFERENCES "SessionPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
