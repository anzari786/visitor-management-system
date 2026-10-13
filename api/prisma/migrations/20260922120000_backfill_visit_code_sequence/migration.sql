-- Keep the sequential visit-code allocator ahead of existing ATI-* codes.
INSERT INTO `visit_code_sequences` (`id`)
SELECT MAX(CAST(SUBSTRING_INDEX(`visitCode`, '-', -1) AS UNSIGNED))
FROM `visits`
WHERE `visitCode` REGEXP '^ATI-[0-9]+$'
HAVING COUNT(*) > 0
ON DUPLICATE KEY UPDATE `id` = `id`;