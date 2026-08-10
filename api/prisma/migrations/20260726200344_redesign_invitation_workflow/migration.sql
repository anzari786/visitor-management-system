/*
  Warnings:

  - The values [VISITOR_ARRIVED,CHECK_OUT_COMPLETED] on the enum `notifications_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `origin` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the `attendances` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[invitation_id]` on the table `visits` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_badge_id_fkey`;

-- DropForeignKey
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_checked_in_by_id_fkey`;

-- DropForeignKey
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_checked_out_by_id_fkey`;

-- DropForeignKey
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_visit_participant_id_fkey`;

-- DropForeignKey
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_visit_schedule_id_fkey`;

-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `invitation_id` INTEGER NULL,
    MODIFY `type` ENUM('VISIT_SUBMITTED', 'VISIT_APPROVED', 'VISIT_REJECTED', 'VISIT_RESCHEDULED', 'VISITOR_CHECKED_IN', 'VISITOR_CHECKED_OUT', 'OVERDUE_CHECKOUT', 'INVITATION_SENT', 'INVITATION_APPROVED', 'INVITATION_REJECTED', 'INVITATION_CANCELLED', 'INVITATION_EXPIRED', 'INVITATION_CONVERTED') NOT NULL;

-- AlterTable
ALTER TABLE `visit_status_history` MODIFY `fromStatus` ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'EXPIRED') NULL,
    MODIFY `toStatus` ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL;

-- AlterTable
ALTER TABLE `visits` DROP COLUMN `origin`,
    ADD COLUMN `invitation_id` INTEGER NULL,
    MODIFY `status` ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL;

-- DropTable
DROP TABLE `attendances`;

-- CreateTable
CREATE TABLE `invitations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invitationCode` VARCHAR(191) NOT NULL,
    `qrToken` VARCHAR(191) NOT NULL,
    `groupType` ENUM('SINGLE', 'GROUP') NOT NULL,
    `durationType` ENUM('SINGLE_DAY', 'MULTI_DAY') NOT NULL,
    `status` ENUM('SENT', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'CONVERTED') NOT NULL,
    `expected_visitor_count` INTEGER NOT NULL DEFAULT 1,
    `organization` VARCHAR(191) NULL,
    `purpose` TEXT NOT NULL,
    `host_employee_id` INTEGER NOT NULL,
    `departmentNameSnapshot` VARCHAR(191) NULL,
    `departmentCodeSnapshot` VARCHAR(191) NULL,
    `planned_start_date` DATE NOT NULL,
    `planned_end_date` DATE NOT NULL,
    `created_by_id` INTEGER NULL,
    `sent_at` DATETIME(3) NULL,
    `arrived_at` DATETIME(3) NULL,
    `decided_by_id` INTEGER NULL,
    `decisionNote` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invitations_invitationCode_key`(`invitationCode`),
    UNIQUE INDEX `invitations_qrToken_key`(`qrToken`),
    INDEX `invitations_status_idx`(`status`),
    INDEX `invitations_host_employee_id_idx`(`host_employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitation_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invitation_id` INTEGER NOT NULL,
    `fromStatus` ENUM('SENT', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'CONVERTED') NULL,
    `toStatus` ENUM('SENT', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'CONVERTED') NOT NULL,
    `changed_by_id` INTEGER NULL,
    `note` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `invitation_status_history_invitation_id_idx`(`invitation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_attendances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_participant_id` INTEGER NOT NULL,
    `visit_schedule_id` INTEGER NOT NULL,
    `badge_id` INTEGER NULL,
    `badge_assigned_at` DATETIME(3) NULL,
    `status` ENUM('SCHEDULED', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
    `personalIdRetained` BOOLEAN NOT NULL DEFAULT false,
    `personal_id_returned_at` DATETIME(3) NULL,
    `check_in_at` DATETIME(3) NULL,
    `check_out_at` DATETIME(3) NULL,
    `checked_in_by_id` INTEGER NULL,
    `checked_out_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `visit_attendances_status_idx`(`status`),
    UNIQUE INDEX `visit_attendances_visit_participant_id_visit_schedule_id_key`(`visit_participant_id`, `visit_schedule_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `notifications_invitation_id_idx` ON `notifications`(`invitation_id`);

-- CreateIndex
CREATE UNIQUE INDEX `visits_invitation_id_key` ON `visits`(`invitation_id`);

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_host_employee_id_fkey` FOREIGN KEY (`host_employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_decided_by_id_fkey` FOREIGN KEY (`decided_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitation_status_history` ADD CONSTRAINT `invitation_status_history_invitation_id_fkey` FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitation_status_history` ADD CONSTRAINT `invitation_status_history_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_invitation_id_fkey` FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_attendances` ADD CONSTRAINT `visit_attendances_visit_participant_id_fkey` FOREIGN KEY (`visit_participant_id`) REFERENCES `visit_participants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_attendances` ADD CONSTRAINT `visit_attendances_visit_schedule_id_fkey` FOREIGN KEY (`visit_schedule_id`) REFERENCES `visit_schedules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_attendances` ADD CONSTRAINT `visit_attendances_badge_id_fkey` FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_attendances` ADD CONSTRAINT `visit_attendances_checked_in_by_id_fkey` FOREIGN KEY (`checked_in_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_attendances` ADD CONSTRAINT `visit_attendances_checked_out_by_id_fkey` FOREIGN KEY (`checked_out_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_invitation_id_fkey` FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
