#!/bin/bash
# Run missing migration SQL when "prisma migrate deploy" says nothing pending
# but tables like expenses / store_trust_features are absent.
set -euo pipefail

DB=citytools_city_tools
APP_USER=citytools_app
BACKEND=/root/city-tools/backend

echo "=== Applying migration SQL manually on $DB ==="
for f in \
  "$BACKEND/prisma/migrations/20260507140651_add_supplier_audit_expenses/migration.sql" \
  "$BACKEND/prisma/migrations/20260531192227_add_store_fields/migration.sql" \
  "$BACKEND/prisma/migrations/20260611120000_add_category_store_columns/migration.sql" \
  "$BACKEND/prisma/migrations/20260613130000_add_show_defective_category/migration.sql"
do
  echo "-> $f"
  sudo -u postgres psql -d "$DB" -f "$f" 2>/dev/null || echo "   (some statements skipped — OK if already exists)"
done

echo "=== store_trust_features (no migration file in repo yet) ==="
sudo -u postgres psql -d "$DB" <<'SQL'
CREATE TABLE IF NOT EXISTS store_trust_features (
    id SERIAL PRIMARY KEY,
    icon VARCHAR(50),
    title_en VARCHAR(100) NOT NULL,
    title_ar VARCHAR(100),
    subtitle_en VARCHAR(200),
    subtitle_ar VARCHAR(200),
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
SQL

echo "=== post-restore patches ==="
sudo -u postgres psql -d "$DB" -f /root/city-tools/scripts/post-restore-schema-patches.sql

echo "=== grants ==="
sudo -u postgres psql -d "$DB" -c "
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_USER};
"

echo "=== table check ==="
sudo -u postgres psql -d "$DB" -c "
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('expenses','supplier_payments','store_statistics','store_discount_cards','store_trust_features','delivery_zones')
ORDER BY 1;
"

echo "Done."
