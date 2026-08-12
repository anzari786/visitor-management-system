-- CreateTable
CREATE TABLE `visit_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hostName` VARCHAR(191) NOT NULL,
    `hostEmail` VARCHAR(191) NULL,
    `departmentId` INTEGER NOT NULL,
    `purpose` ENUM('meeting', 'interview', 'delivery', 'official_visit', 'maintenance', 'other') NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `rejectionReason` TEXT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `visit_requests_status_idx`(`status`),
    INDEX `visit_requests_departmentId_idx`(`departmentId`),
    INDEX `visit_requests_startDate_idx`(`startDate`),
    INDEX `visit_requests_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_request_visitors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitRequestId` INTEGER NOT NULL,
    `visitorId` INTEGER NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `organization` VARCHAR(191) NULL,

    INDEX `visit_request_visitors_visitorId_idx`(`visitorId`),
    UNIQUE INDEX `visit_request_visitors_visitRequestId_visitorId_key`(`visitRequestId`, `visitorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visit_requests` ADD CONSTRAINT `visit_requests_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_requests` ADD CONSTRAINT `visit_requests_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_request_visitors` ADD CONSTRAINT `visit_request_visitors_visitRequestId_fkey` FOREIGN KEY (`visitRequestId`) REFERENCES `visit_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_request_visitors` ADD CONSTRAINT `visit_request_visitors_visitorId_fkey` FOREIGN KEY (`visitorId`) REFERENCES `visitors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
