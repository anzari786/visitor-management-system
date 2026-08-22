-- Replace reusable badge inventory with one-time thermal badge print jobs.

-- Drop FK / indexes from visit_attendances → badges
ALTER TABLE `visit_attendances` DROP FOREIGN KEY `visit_attendances_badgeId_fkey`;
DROP INDEX `visit_attendances_badgeId_idx` ON `visit_attendances`;

ALTER TABLE `visit_attendances`
  DROP COLUMN `badgeId`,
  DROP COLUMN `badgeAssignedAt`;

ALTER TABLE `visit_attendances`
  ADD COLUMN `badgeToken` VARCHAR(191) NULL,
  ADD COLUMN `badgePrintedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `visit_attendances_badgeToken_key` ON `visit_attendances`(`badgeToken`);

-- Remove reusable badge inventory
DROP TABLE IF EXISTS `badges`;

-- Print job status enum
CREATE TABLE `badge_print_jobs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attendanceId` INTEGER NOT NULL,
    `status` ENUM('QUEUED', 'PRINTING', 'PRINTED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'QUEUED',
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `printedAt` DATETIME(3) NULL,
    `errorMessage` TEXT NULL,
    `claimedBy` VARCHAR(191) NULL,
    `claimedAt` DATETIME(3) NULL,
    `activeAttendanceId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `badge_print_jobs_activeAttendanceId_key` ON `badge_print_jobs`(`activeAttendanceId`);
CREATE INDEX `badge_print_jobs_attendanceId_idx` ON `badge_print_jobs`(`attendanceId`);
CREATE INDEX `badge_print_jobs_status_requestedAt_idx` ON `badge_print_jobs`(`status`, `requestedAt`);
CREATE INDEX `badge_print_jobs_claimedAt_idx` ON `badge_print_jobs`(`claimedAt`);

ALTER TABLE `badge_print_jobs`
  ADD CONSTRAINT `badge_print_jobs_attendanceId_fkey`
  FOREIGN KEY (`attendanceId`) REFERENCES `visit_attendances`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
