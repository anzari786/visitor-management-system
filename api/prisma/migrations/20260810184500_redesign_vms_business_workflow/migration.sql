-- Redesign VMS schema for full visit / invitation / attendance workflow.
-- Drops prior walk-in and interim v2 tables, then creates the new model.
-- Department is stored as values on employees/visits (no departments table).

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `visit_attendances`;
DROP TABLE IF EXISTS `visit_status_history`;
DROP TABLE IF EXISTS `visit_participants`;
DROP TABLE IF EXISTS `visit_days`;
DROP TABLE IF EXISTS `visit_schedules`;
DROP TABLE IF EXISTS `invitation_participants`;
DROP TABLE IF EXISTS `invitation_status_history`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `invitations`;
DROP TABLE IF EXISTS `visits`;
DROP TABLE IF EXISTS `badges`;
DROP TABLE IF EXISTS `visitors`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `user_role_assignments`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `sessions`;

SET FOREIGN_KEY_CHECKS = 1;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` ENUM('GUARD', 'RECEPTION', 'ADMIN', 'MANAGER') NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `userId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_roles_roleId_idx`(`roleId`),
    PRIMARY KEY (`userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalSubject` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `employeeId` INTEGER NULL,

    UNIQUE INDEX `users_externalSubject_key`(`externalSubject`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_employeeId_key`(`employeeId`),
    INDEX `users_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalEmployeeId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `departmentName` VARCHAR(191) NOT NULL,
    `departmentCode` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_externalEmployeeId_key`(`externalEmployeeId`),
    UNIQUE INDEX `employees_email_key`(`email`),
    INDEX `employees_departmentName_idx`(`departmentName`),
    INDEX `employees_isActive_idx`(`isActive`),
    INDEX `employees_lastName_firstName_idx`(`lastName`, `firstName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `organization` VARCHAR(191) NULL,
    `idType` ENUM('NATIONAL_ID', 'KEBELE_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'OTHER') NULL,
    `idNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `visitors_email_idx`(`email`),
    INDEX `visitors_phone_idx`(`phone`),
    INDEX `visitors_lastName_firstName_idx`(`lastName`, `firstName`),
    UNIQUE INDEX `visitors_idType_idNumber_key`(`idType`, `idNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitCode` VARCHAR(191) NOT NULL,
    `qrToken` VARCHAR(191) NOT NULL,
    `source` ENUM('PUBLIC', 'RECEPTION', 'HOST_INVITATION') NOT NULL,
    `groupType` ENUM('SINGLE', 'GROUP') NOT NULL,
    `durationType` ENUM('SINGLE_DAY', 'MULTI_DAY') NOT NULL,
    `status` ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'CANCELLED', 'PARTIALLY_CHECKED_IN', 'CHECKED_IN', 'PARTIALLY_CHECKED_OUT', 'CHECKED_OUT') NOT NULL DEFAULT 'PENDING_APPROVAL',
    `purpose` ENUM('MEETING', 'INTERVIEW', 'DELIVERY', 'OFFICIAL_VISIT', 'MAINTENANCE', 'OTHER') NOT NULL,
    `hostEmployeeId` INTEGER NOT NULL,
    `hostNameSnapshot` VARCHAR(191) NULL,
    `hostEmailSnapshot` VARCHAR(191) NULL,
    `departmentNameSnapshot` VARCHAR(191) NULL,
    `departmentCodeSnapshot` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `room` VARCHAR(191) NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `expectedVisitorCount` INTEGER NOT NULL DEFAULT 1,
    `organization` VARCHAR(191) NULL,
    `createdById` INTEGER NULL,
    `decidedById` INTEGER NULL,
    `decisionAt` DATETIME(3) NULL,
    `decisionNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visits_visitCode_key`(`visitCode`),
    UNIQUE INDEX `visits_qrToken_key`(`qrToken`),
    INDEX `visits_status_idx`(`status`),
    INDEX `visits_source_idx`(`source`),
    INDEX `visits_hostEmployeeId_idx`(`hostEmployeeId`),
    INDEX `visits_departmentNameSnapshot_idx`(`departmentNameSnapshot`),
    INDEX `visits_startDate_endDate_idx`(`startDate`, `endDate`),
    INDEX `visits_purpose_idx`(`purpose`),
    INDEX `visits_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_days` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visit_days_date_idx`(`date`),
    UNIQUE INDEX `visit_days_visitId_date_key`(`visitId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitId` INTEGER NOT NULL,
    `visitorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visit_participants_visitorId_idx`(`visitorId`),
    UNIQUE INDEX `visit_participants_visitId_visitorId_key`(`visitId`, `visitorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `badges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `badgeNumber` VARCHAR(191) NOT NULL,
    `qrToken` VARCHAR(191) NOT NULL,
    `status` ENUM('AVAILABLE', 'ASSIGNED', 'LOST', 'DISABLED') NOT NULL DEFAULT 'AVAILABLE',
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `badges_badgeNumber_key`(`badgeNumber`),
    UNIQUE INDEX `badges_qrToken_key`(`qrToken`),
    INDEX `badges_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_attendances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `participantId` INTEGER NOT NULL,
    `visitDayId` INTEGER NOT NULL,
    `status` ENUM('EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW') NOT NULL DEFAULT 'EXPECTED',
    `badgeId` INTEGER NULL,
    `badgeAssignedAt` DATETIME(3) NULL,
    `personalIdRetained` BOOLEAN NOT NULL DEFAULT false,
    `personalIdReturnedAt` DATETIME(3) NULL,
    `checkInAt` DATETIME(3) NULL,
    `checkOutAt` DATETIME(3) NULL,
    `checkedInById` INTEGER NULL,
    `checkedOutById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `visit_attendances_visitDayId_idx`(`visitDayId`),
    INDEX `visit_attendances_badgeId_idx`(`badgeId`),
    INDEX `visit_attendances_status_idx`(`status`),
    INDEX `visit_attendances_checkInAt_idx`(`checkInAt`),
    UNIQUE INDEX `visit_attendances_participantId_visitDayId_key`(`participantId`, `visitDayId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitId` INTEGER NOT NULL,
    `fromStatus` ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'CANCELLED', 'PARTIALLY_CHECKED_IN', 'CHECKED_IN', 'PARTIALLY_CHECKED_OUT', 'CHECKED_OUT') NULL,
    `toStatus` ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'CANCELLED', 'PARTIALLY_CHECKED_IN', 'CHECKED_IN', 'PARTIALLY_CHECKED_OUT', 'CHECKED_OUT') NOT NULL,
    `changedById` INTEGER NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visit_status_history_visitId_idx`(`visitId`),
    INDEX `visit_status_history_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('VISIT_SUBMITTED', 'VISIT_APPROVAL_REQUEST', 'VISIT_APPROVED', 'VISIT_REJECTED', 'VISIT_RESCHEDULED', 'VISIT_CANCELLED', 'VISITOR_ARRIVED', 'VISITOR_CHECKED_OUT', 'OVERDUE_VISIT', 'INVITATION_SENT') NOT NULL,
    `channel` ENUM('DASHBOARD', 'EMAIL') NOT NULL,
    `title` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `sentAt` DATETIME(3) NULL,
    `recipientUserId` INTEGER NULL,
    `recipientEmail` VARCHAR(191) NULL,
    `visitId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_recipientUserId_isRead_idx`(`recipientUserId`, `isRead`),
    INDEX `notifications_recipientEmail_idx`(`recipientEmail`),
    INDEX `notifications_visitId_idx`(`visitId`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `session_id` VARCHAR(128) NOT NULL,
    `expires` INTEGER NOT NULL,
    `data` MEDIUMTEXT NULL,

    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_hostEmployeeId_fkey` FOREIGN KEY (`hostEmployeeId`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_decidedById_fkey` FOREIGN KEY (`decidedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_days` ADD CONSTRAINT `visit_days_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_participants` ADD CONSTRAINT `visit_participants_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_participants` ADD CONSTRAINT `visit_participants_visitorId_fkey` FOREIGN KEY (`visitorId`) REFERENCES `visitors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_attendances` ADD CONSTRAINT `visit_attendances_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `visit_participants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_attendances` ADD CONSTRAINT `visit_attendances_visitDayId_fkey` FOREIGN KEY (`visitDayId`) REFERENCES `visit_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_attendances` ADD CONSTRAINT `visit_attendances_badgeId_fkey` FOREIGN KEY (`badgeId`) REFERENCES `badges`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_attendances` ADD CONSTRAINT `visit_attendances_checkedInById_fkey` FOREIGN KEY (`checkedInById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_attendances` ADD CONSTRAINT `visit_attendances_checkedOutById_fkey` FOREIGN KEY (`checkedOutById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_status_history` ADD CONSTRAINT `visit_status_history_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_status_history` ADD CONSTRAINT `visit_status_history_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipientUserId_fkey` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `visits`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_settings` ADD CONSTRAINT `system_settings_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
