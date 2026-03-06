/*
  Warnings:

  - You are about to drop the column `unsubscribedAt` on the `NewsletterSubscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NewsletterSubscription" DROP COLUMN "unsubscribedAt";
