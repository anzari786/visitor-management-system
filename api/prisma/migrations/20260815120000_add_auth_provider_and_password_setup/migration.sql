-- Add AuthProvider enum column (nullable first for safe backfill)
ALTER TABLE `users` ADD COLUMN `authProvider` ENUM('SSO', 'LOCAL') NULL;

-- SSO: linked to HR employee and/or already has an IdP subject
UPDATE `users`
SET `authProvider` = 'SSO'
WHERE `employeeId` IS NOT NULL OR `externalSubject` IS NOT NULL;

-- Remaining accounts are local username/password users
UPDATE `users`
SET `authProvider` = 'LOCAL'
WHERE `authProvider` IS NULL;

-- Enforce SSO invariants on existing data
UPDATE `users`
SET
  `username` = NULL,
  `passwordHash` = NULL,
  `mustChangePassword` = 0
WHERE `authProvider` = 'SSO';

-- Enforce LOCAL invariants on existing data
UPDATE `users`
SET
  `employeeId` = NULL,
  `externalSubject` = NULL
WHERE `authProvider` = 'LOCAL';

ALTER TABLE `users` MODIFY `authProvider` ENUM('SSO', 'LOCAL') NOT NULL;

CREATE INDEX `users_authProvider_idx` ON `users`(`authProvider`);

-- Password setup tokens for LOCAL account invitations
CREATE TABLE `password_setup_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_setup_tokens_tokenHash_key`(`tokenHash`),
    INDEX `password_setup_tokens_userId_idx`(`userId`),
    INDEX `password_setup_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `password_setup_tokens` ADD CONSTRAINT `password_setup_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
