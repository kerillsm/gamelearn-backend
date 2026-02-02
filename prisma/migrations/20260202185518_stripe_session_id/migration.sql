/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "SessionStatus" ADD VALUE 'PAYED';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Session_stripeSessionId_key" ON "Session"("stripeSessionId");
