-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('VIBE_CHECK', 'ONE_SESSION', 'SESSIONS_PACK');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mentorUserId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMPTZ NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "type" "SessionType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "serviceFee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_mentorUserId_idx" ON "Session"("mentorUserId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_mentorUserId_fkey" FOREIGN KEY ("mentorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
