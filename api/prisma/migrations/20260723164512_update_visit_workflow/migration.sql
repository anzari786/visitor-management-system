/*
  Warnings:

  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `mustChangePassword` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `visitors` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `visitors` table. All the data in the column will be lost.
  - The values [national_id,kebele_id,passport,drivers_license,other] on the enum `visitors_idType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `badgeNumber` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `checkedInAt` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `checkedInById` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `checkedOutAt` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `checkedOutById` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `checkoutNote` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `hostName` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `visitorId` on the `visits` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `visits` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(8))`.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `settings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[external_subject]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employee_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[visitCode]` on the table `visits` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qrToken]` on the table `visits` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `external_subject` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `visitors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `visitors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `visitors` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `visitors` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `durationType` to the `visits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupType` to the `visits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin` to the `visits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `visits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qrToken` to the `visits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `visits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitCode` to the `visits` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `visits` DROP FOREIGN KEY `visits_checkedInById_fkey`;

-- DropForeignKey
ALTER TABLE `visits` DROP FOREIGN KEY `visits_checkedOutById_fkey`;

-- DropForeignKey
ALTER TABLE `visits` DROP FOREIGN KEY `visits_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `visits` DROP FOREIGN KEY `visits_visitorId_fkey`;

-- DropIndex
DROP INDEX `users_username_key` ON `users`;

-- DropIndex
DROP INDEX `visits_badgeNumber_idx` ON `visits`;

-- DropIndex
DROP INDEX `visits_checkedInAt_idx` ON `visits`;

-- DropIndex
DROP INDEX `visits_checkedInById_fkey` ON `visits`;

-- DropIndex
DROP INDEX `visits_checkedOutById_fkey` ON `visits`;

-- DropIndex
DROP INDEX `visits_departmentId_idx` ON `visits`;

-- DropIndex
DROP INDEX `visits_visitorId_idx` ON `visits`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `createdAt`,
    DROP COLUMN `firstName`,
    DROP COLUMN `lastLoginAt`,
    DROP COLUMN `lastName`,
    DROP COLUMN `mustChangePassword`,
    DROP COLUMN `passwordHash`,
    DROP COLUMN `phone`,
    DROP COLUMN `role`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `username`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `employee_id` INTEGER NULL,
    ADD COLUMN `external_subject` VARCHAR(191) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `visitors` DROP COLUMN `createdAt`,
    DROP COLUMN `fullName`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `firstName` VARCHAR(191) NOT NULL,
    ADD COLUMN `lastName` VARCHAR(191) NOT NULL,
    ADD COLUMN `organization` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `phone` VARCHAR(191) NOT NULL,
    MODIFY `idType` ENUM('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'KEBELE_ID', 'OTHER') NOT NULL;

-- AlterTable
ALTER TABLE `visits` DROP COLUMN `badgeNumber`,
    DROP COLUMN `checkedInAt`,
    DROP COLUMN `checkedInById`,
    DROP COLUMN `checkedOutAt`,
    DROP COLUMN `checkedOutById`,
    DROP COLUMN `checkoutNote`,
    DROP COLUMN `departmentId`,
    DROP COLUMN `hostName`,
    DROP COLUMN `visitorId`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by_id` INTEGER NULL,
    ADD COLUMN `decided_by_id` INTEGER NULL,
    ADD COLUMN `decisionNote` TEXT NULL,
    ADD COLUMN `decision_at` DATETIME(3) NULL,
    ADD COLUMN `departmentCodeSnapshot` VARCHAR(191) NULL,
    ADD COLUMN `departmentNameSnapshot` VARCHAR(191) NULL,
    ADD COLUMN `durationType` ENUM('SINGLE_DAY', 'MULTI_DAY') NOT NULL,
    ADD COLUMN `groupType` ENUM('SINGLE', 'GROUP') NOT NULL,
    ADD COLUMN `hostEmailSnapshot` VARCHAR(191) NULL,
    ADD COLUMN `host_employee_id` INTEGER NULL,
    ADD COLUMN `isAssisted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `origin` ENUM('VISITOR_REQUEST', 'HOST_INVITATION') NOT NULL,
    ADD COLUMN `purpose` TEXT NOT NULL,
    ADD COLUMN `qrToken` VARCHAR(191) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD COLUMN `visitCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `visit_expires_at` DATETIME(3) NULL,
    MODIFY `status` ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'COMPLETED', 'EXPIRED', 'CANCELLED') NOT NULL;

-- DropTable
DROP TABLE `departments`;

-- DropTable
DROP TABLE `settings`;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_role_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assigned_by_id` INTEGER NULL,

    INDEX `user_role_assignments_role_id_idx`(`role_id`),
    UNIQUE INDEX `user_role_assignments_user_id_role_id_key`(`user_id`, `role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `external_employee_id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `departmentName` VARCHAR(191) NOT NULL,
    `departmentCode` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `last_synced_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_external_employee_id_key`(`external_employee_id`),
    INDEX `employees_departmentName_idx`(`departmentName`),
    INDEX `employees_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `expected_start_time` DATETIME(3) NULL,
    `expected_end_time` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `visit_schedules_visit_id_date_key`(`visit_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_id` INTEGER NOT NULL,
    `visitor_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `visit_participants_visit_id_visitor_id_key`(`visit_id`, `visitor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `badges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `badgeNumber` INTEGER NOT NULL,
    `qrToken` VARCHAR(191) NOT NULL,
    `status` ENUM('AVAILABLE', 'ASSIGNED', 'LOST', 'DAMAGED', 'RETIRED') NOT NULL DEFAULT 'AVAILABLE',
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `badges_badgeNumber_key`(`badgeNumber`),
    UNIQUE INDEX `badges_qrToken_key`(`qrToken`),
    INDEX `badges_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_participant_id` INTEGER NOT NULL,
    `visit_schedule_id` INTEGER NOT NULL,
    `badge_id` INTEGER NULL,
    `badge_assigned_at` DATETIME(3) NULL,
    `status` ENUM('SCHEDULED', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
    `checkInPhotoUrl` VARCHAR(191) NULL,
    `personalIdRetained` BOOLEAN NOT NULL DEFAULT false,
    `personal_id_returned_at` DATETIME(3) NULL,
    `check_in_at` DATETIME(3) NULL,
    `check_out_at` DATETIME(3) NULL,
    `checked_in_by_id` INTEGER NULL,
    `checked_out_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `attendances_status_idx`(`status`),
    UNIQUE INDEX `attendances_visit_participant_id_visit_schedule_id_key`(`visit_participant_id`, `visit_schedule_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_id` INTEGER NOT NULL,
    `fromStatus` ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'COMPLETED', 'EXPIRED', 'CANCELLED') NULL,
    `toStatus` ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'COMPLETED', 'EXPIRED', 'CANCELLED') NOT NULL,
    `changed_by_id` INTEGER NULL,
    `note` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visit_status_history_visit_id_idx`(`visit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('VISIT_SUBMITTED', 'VISIT_APPROVED', 'VISIT_REJECTED', 'VISIT_RESCHEDULED', 'VISITOR_ARRIVED', 'CHECK_OUT_COMPLETED', 'OVERDUE_CHECKOUT') NOT NULL,
    `channel` ENUM('EMAIL', 'DASHBOARD') NOT NULL,
    `visit_id` INTEGER NULL,
    `recipient_user_id` INTEGER NULL,
    `recipientEmail` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_visit_id_idx`(`visit_id`),
    INDEX `notifications_recipient_user_id_idx`(`recipient_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `updated_by_id` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `system_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sid` VARCHAR(191) NOT NULL,
    `data` TEXT NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_sid_key`(`sid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_external_subject_key` ON `users`(`external_subject`);

-- CreateIndex
CREATE UNIQUE INDEX `users_employee_id_key` ON `users`(`employee_id`);

-- CreateIndex
CREATE INDEX `visitors_phone_idx` ON `visitors`(`phone`);

-- CreateIndex
CREATE INDEX `visitors_lastName_firstName_idx` ON `visitors`(`lastName`, `firstName`);

-- CreateIndex
CREATE UNIQUE INDEX `visits_visitCode_key` ON `visits`(`visitCode`);

-- CreateIndex
CREATE UNIQUE INDEX `visits_qrToken_key` ON `visits`(`qrToken`);

-- CreateIndex
CREATE INDEX `visits_host_employee_id_idx` ON `visits`(`host_employee_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_role_assignments` ADD CONSTRAINT `user_role_assignments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_role_assignments` ADD CONSTRAINT `user_role_assignments_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_role_assignments` ADD CONSTRAINT `user_role_assignments_assigned_by_id_fkey` FOREIGN KEY (`assigned_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_host_employee_id_fkey` FOREIGN KEY (`host_employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_decided_by_id_fkey` FOREIGN KEY (`decided_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_schedules` ADD CONSTRAINT `visit_schedules_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_participants` ADD CONSTRAINT `visit_participants_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_participants` ADD CONSTRAINT `visit_participants_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_visit_participant_id_fkey` FOREIGN KEY (`visit_participant_id`) REFERENCES `visit_participants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_visit_schedule_id_fkey` FOREIGN KEY (`visit_schedule_id`) REFERENCES `visit_schedules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_badge_id_fkey` FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_checked_in_by_id_fkey` FOREIGN KEY (`checked_in_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_checked_out_by_id_fkey` FOREIGN KEY (`checked_out_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_status_history` ADD CONSTRAINT `visit_status_history_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_status_history` ADD CONSTRAINT `visit_status_history_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipient_user_id_fkey` FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_settings` ADD CONSTRAINT `system_settings_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
