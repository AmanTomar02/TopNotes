SET NAMES utf8mb4;

-- Repair double-encoded (UTF-8-as-latin1) text from the initial seed import.
UPDATE notes SET
  title       = CONVERT(CAST(CONVERT(title       USING latin1) AS BINARY) USING utf8mb4),
  description = CONVERT(CAST(CONVERT(description USING latin1) AS BINARY) USING utf8mb4);

UPDATE reviews SET
  comment = CONVERT(CAST(CONVERT(comment USING latin1) AS BINARY) USING utf8mb4)
WHERE comment IS NOT NULL;

UPDATE users SET
  bio = CONVERT(CAST(CONVERT(bio USING latin1) AS BINARY) USING utf8mb4)
WHERE bio IS NOT NULL;

UPDATE notifications SET
  title   = CONVERT(CAST(CONVERT(title   USING latin1) AS BINARY) USING utf8mb4),
  message = CONVERT(CAST(CONVERT(message USING latin1) AS BINARY) USING utf8mb4);

SELECT '--- AFTER FIX ---' AS info;
SELECT id, title FROM notes ORDER BY id LIMIT 6;
