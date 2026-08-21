/*
  Warnings:

  - You are about to drop the column `qrToken` on the `visits` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `visits_qrToken_key` ON `visits`;

-- AlterTable
ALTER TABLE `visits` DROP COLUMN `qrToken`;
