-- Create the canonical department table and preserve existing employee data.
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalDepartmentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `departments_externalDepartmentId_key`(`externalDepartmentId`),
    INDEX `departments_name_idx`(`name`),
    INDEX `departments_code_idx`(`code`),
    INDEX `departments_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `departments` (`externalDepartmentId`, `name`, `code`, `updatedAt`)
SELECT DISTINCT
    COALESCE(NULLIF(`departmentCode`, ''), `departmentName`),
    `departmentName`,
    NULLIF(`departmentCode`, ''),
    CURRENT_TIMESTAMP(3)
FROM `employees`;

ALTER TABLE `employees` ADD COLUMN `departmentId` INTEGER NULL;

UPDATE `employees` e
INNER JOIN `departments` d
    ON d.`externalDepartmentId` = COALESCE(NULLIF(e.`departmentCode`, ''), e.`departmentName`)
SET e.`departmentId` = d.`id`;

CREATE INDEX `employees_departmentId_idx` ON `employees`(`departmentId`);

ALTER TABLE `employees`
    ADD CONSTRAINT `employees_departmentId_fkey`
    FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;