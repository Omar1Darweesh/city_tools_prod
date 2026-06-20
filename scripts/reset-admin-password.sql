-- Run on citytools_city_tools after restore (ops / one-time).
-- Resets admin password and disables weak test accounts.
--
-- Usage:
--   sudo -u postgres psql -d citytools_city_tools -f scripts/reset-admin-password.sql
--
-- Default password after run: admin123
-- Change immediately after first login if this is production-facing.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE users
SET password_hash = crypt('admin123', gen_salt('bf', 10)),
    active = true
WHERE username = 'admin';

UPDATE users
SET active = false
WHERE username IN ('testadmin', 'test', 'demo');

COMMIT;

SELECT username, active,
       CASE WHEN username = 'admin' THEN 'password reset to admin123' ELSE '' END AS note
FROM users
WHERE username IN ('admin', 'testadmin', 'test', 'demo');
