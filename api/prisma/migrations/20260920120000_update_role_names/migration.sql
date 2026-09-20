-- Temporarily allow both old and new role names.
ALTER TABLE `roles`
MODIFY `name` ENUM('GUARD', 'RECEPTION', 'ADMIN', 'MANAGER', 'GUARD_MANAGER', 'HOST') NOT NULL;

-- Rename existing roles.
UPDATE `roles`
SET `name` = 'GUARD_MANAGER'
WHERE `name` = 'MANAGER';

UPDATE `roles`
SET `name` = 'HOST'
WHERE `name` = 'RECEPTION';

-- Remove the old role names from the enum.
ALTER TABLE `roles`
MODIFY `name` ENUM('GUARD', 'GUARD_MANAGER', 'ADMIN', 'HOST') NOT NULL;
