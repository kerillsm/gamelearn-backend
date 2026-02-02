-- AlterEnum
ALTER TYPE "SessionStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "venue" TEXT;
