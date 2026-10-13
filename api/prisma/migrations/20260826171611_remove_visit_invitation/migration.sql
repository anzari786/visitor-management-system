/*
  Warnings:

  - You are about to drop the `visit_invitations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `visit_invitations` DROP FOREIGN KEY `visit_invitations_visitId_fkey`;

-- DropTable
DROP TABLE `visit_invitations`;
