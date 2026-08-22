-- AlterTable: add VISITOR_REGISTERED notification type
ALTER TABLE `notifications` MODIFY `type` ENUM(
  'VISIT_SUBMITTED',
  'VISIT_APPROVAL_REQUEST',
  'VISIT_APPROVED',
  'VISIT_REJECTED',
  'VISIT_RESCHEDULED',
  'VISIT_CANCELLED',
  'VISITOR_ARRIVED',
  'VISITOR_CHECKED_OUT',
  'OVERDUE_VISIT',
  'INVITATION_SENT',
  'VISITOR_REGISTERED'
) NOT NULL;

-- CreateTable
CREATE TABLE `visit_invitations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitId` INTEGER NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visit_invitations_visitId_key`(`visitId`),
    UNIQUE INDEX `visit_invitations_tokenHash_key`(`tokenHash`),
    INDEX `visit_invitations_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visit_invitations` ADD CONSTRAINT `visit_invitations_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
