/*
  Warnings:

  - Added the required column `price` to the `MentorProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MentorProfile" ADD COLUMN     "price" INTEGER NOT NULL;
