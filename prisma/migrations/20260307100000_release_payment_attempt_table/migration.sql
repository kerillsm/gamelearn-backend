-- CreateTable
CREATE TABLE "ReleasePaymentAttempt" (
    "groupKey" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleasePaymentAttempt_pkey" PRIMARY KEY ("groupKey")
);
