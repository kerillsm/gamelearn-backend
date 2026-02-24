-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SessionPackStatus" ADD VALUE 'CANCELED_BY_APPLICANT';
ALTER TYPE "SessionPackStatus" ADD VALUE 'CANCELED_BY_MENTOR';

-- AlterTable
ALTER TABLE "SessionPackage" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "refundAmount" DOUBLE PRECISION,
ADD COLUMN     "refundedAt" TIMESTAMPTZ,
ADD COLUMN     "stripeRefundId" TEXT;
