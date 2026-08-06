
-- Create roles table
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- Insert default roles
INSERT INTO `roles` (`name`)
VALUES
('admin'),
('front_desk');


-- Create user_roles table
CREATE TABLE `user_roles` (
    `userId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,

    PRIMARY KEY (`userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- Copy existing user roles
INSERT INTO `user_roles` (`userId`, `roleId`)
SELECT 
    users.id,
    roles.id
FROM users
JOIN roles ON roles.name = users.role;


-- Remove old role column
ALTER TABLE `users` DROP COLUMN `role`;


-- Add foreign keys
ALTER TABLE `user_roles`
ADD CONSTRAINT `user_roles_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE `user_roles`
ADD CONSTRAINT `user_roles_roleId_fkey`
FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`)
ON DELETE RESTRICT ON UPDATE CASCADE;
