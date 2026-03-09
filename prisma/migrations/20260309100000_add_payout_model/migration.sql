-- CreateEnum
CREATE TYPE "PayoutOwnerType" AS ENUM ('PLATFORM', 'CONNECTED_ACCOUNT');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'PAID', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "ownerType" "PayoutOwnerType" NOT NULL,
    "userId" TEXT,
    "stripeAccountId" TEXT,
    "stripePayoutId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL,
    "arrivalDate" TIMESTAMPTZ,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_stripePayoutId_key" ON "Payout"("stripePayoutId");

-- CreateIndex
CREATE INDEX "Payout_userId_idx" ON "Payout"("userId");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
