/*
  Warnings:

  - Added the required column `firstSessionStartAt` to the `SessionPackage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastSessionEndAt` to the `SessionPackage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SessionPackage" ADD COLUMN     "firstSessionStartAt" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "lastSessionEndAt" TIMESTAMPTZ NOT NULL;
