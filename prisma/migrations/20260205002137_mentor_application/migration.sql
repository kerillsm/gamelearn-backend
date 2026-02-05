-- CreateEnum
CREATE TYPE "MentorApplicationStatus" AS ENUM ('PENDING', 'REJECTED', 'APPROVED');

-- CreateTable
CREATE TABLE "MentorApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "game" "MentorGame" NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "experiencePlaying" TEXT NOT NULL,
    "experienceTeaching" TEXT,
    "socialMedia" TEXT,
    "aboutYourself" TEXT,
    "contactInfo" TEXT NOT NULL,
    "steamProfile" TEXT NOT NULL,
    "status" "MentorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MentorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorApplication_userId_key" ON "MentorApplication"("userId");

-- AddForeignKey
ALTER TABLE "MentorApplication" ADD CONSTRAINT "MentorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
