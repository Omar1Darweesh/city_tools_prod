#!/bin/bash
# =============================================================================
# Migrate production backup → city-tools test stack (NEW system ONLY)
#
# NEVER writes to:
#   - database citytools_pos (original live clients)
#   - /root/citytools
#   - PM2 citytools-backend (port 3020)
#
# ONLY affects:
#   - database citytools_city_tools
#   - /root/city-tools
#   - PM2 citytools-backend-city-tools
#
# Usage (run on VPS as root):
#   ./scripts/migrate-prod-to-city-tools.sh backup
#       Read-only dump of citytools_pos → /root/backups/original/
#
#   ./scripts/migrate-prod-to-city-tools.sh restore [path/to/file.dump]
#       Restore latest (or given) dump into citytools_city_tools + schema fix
#
#   ./scripts/migrate-prod-to-city-tools.sh full
#       backup + restore + fix (interactive confirm)
#
#   ./scripts/migrate-prod-to-city-tools.sh fix
#       Re-apply migrations / grants / pages only (no restore)
#
#   ./scripts/migrate-prod-to-city-tools.sh verify
#       Compare row counts: prod vs new DB
# =============================================================================
set -euo pipefail

SOURCE_DB="citytools_pos"
TARGET_DB="citytools_city_tools"
TARGET_USER="citytools_app"
PROTECTED_PM2="citytools-backend"
TARGET_PM2="citytools-backend-city-tools"
APP_DIR="/root/city-tools"
BACKEND_DIR="$APP_DIR/backend"
BACKUP_DIR="/root/backups/original"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}==>${NC} $*"; }
warn() { echo -e "${YELLOW}!!${NC} $*"; }
die()  { echo -e "${RED}ERROR:${NC} $*" >&2; exit 1; }

require_root() {
  [ "$(id -u)" -eq 0 ] || die "Run as root on the VPS."
}

require_postgres() {
  command -v psql >/dev/null || die "psql not found."
  command -v pg_dump >/dev/null || die "pg_dump not found."
}

load_target_env() {
  [ -f "$BACKEND_DIR/.env" ] || die "Missing $BACKEND_DIR/.env — deploy city-tools first."
  # shellcheck disable=SC1091
  set -a
  source "$BACKEND_DIR/.env"
  set +a
  export DATABASE_URL
  [ -n "${DATABASE_URL:-}" ] || die "DATABASE_URL not set in backend .env"
  if echo "$DATABASE_URL" | grep -q "/${SOURCE_DB}"; then
    die "backend .env points at $SOURCE_DB — must use $TARGET_DB"
  fi
}

confirm_isolated() {
  echo ""
  echo "=============================================="
  echo "  PRODUCTION → CITY-TOOLS MIGRATION"
  echo "=============================================="
  echo "  READ from:  $SOURCE_DB (no changes)"
  echo "  WRITE to:   $TARGET_DB only"
  echo "  App:        $APP_DIR"
  echo "  NOT touched: /root/citytools, $SOURCE_DB, $PROTECTED_PM2"
  echo ""
  if [ "${AUTO_YES:-}" = "1" ]; then
    log "AUTO_YES=1 — skipping confirmation"
    return
  fi
  read -r -p "Type YES to continue: " ans
  [ "$ans" = "YES" ] || die "Aborted."
}

verify_production_safe() {
  if pm2 describe "$PROTECTED_PM2" >/dev/null 2>&1; then
    if pm2 list 2>/dev/null | grep "$PROTECTED_PM2" | grep -q online; then
      log "Original PM2 '$PROTECTED_PM2' is online (good)."
    else
      warn "Original PM2 '$PROTECTED_PM2' is not online — check client production."
    fi
  fi
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$SOURCE_DB'" | grep -q 1; then
    die "Source database $SOURCE_DB not found."
  fi
}

count_rows() {
  local db=$1
  if [ "$db" = "$TARGET_DB" ]; then
    load_target_env
    local pass
    pass=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
    PGPASSWORD="$pass" psql -h localhost -U "$TARGET_USER" -d "$db" -At <<'SQL'
SELECT 'products|' || COUNT(*) FROM products
UNION ALL SELECT 'salesinvoices|' || COUNT(*) FROM salesinvoices
UNION ALL SELECT 'salesreturns|' || COUNT(*) FROM salesreturns
UNION ALL SELECT 'customers|' || COUNT(*) FROM customers
UNION ALL SELECT 'suppliers|' || COUNT(*) FROM suppliers
UNION ALL SELECT 'users|' || COUNT(*) FROM users;
SQL
  else
    sudo -u postgres psql -d "$db" -At <<'SQL'
SELECT 'products|' || COUNT(*) FROM products
UNION ALL SELECT 'salesinvoices|' || COUNT(*) FROM salesinvoices
UNION ALL SELECT 'salesreturns|' || COUNT(*) FROM salesreturns
UNION ALL SELECT 'customers|' || COUNT(*) FROM customers
UNION ALL SELECT 'suppliers|' || COUNT(*) FROM suppliers
UNION ALL SELECT 'users|' || COUNT(*) FROM users;
SQL
  fi
}

LAST_DUMP_FILE=""

cmd_verify() {
  log "Row counts comparison"
  echo "--- $SOURCE_DB (production) ---"
  count_rows "$SOURCE_DB" | sort
  echo ""
  echo "--- $TARGET_DB (city-tools) ---"
  count_rows "$TARGET_DB" | sort
}

cmd_backup() {
  require_root
  require_postgres
  verify_production_safe

  mkdir -p "$BACKUP_DIR"
  local stamp
  stamp=$(date +%Y-%m-%d_%H%M%S)
  local dump_file="/tmp/citytools_pos_FULL_${stamp}.dump"
  local sql_file="/tmp/citytools_pos_FULL_${stamp}.sql"

  log "Creating read-only backup of $SOURCE_DB (postgres writes to /tmp first)"
  sudo -u postgres pg_dump -Fc -f "$dump_file" "$SOURCE_DB"
  sudo -u postgres pg_dump -f "$sql_file" "$SOURCE_DB"

  mv "$dump_file" "$BACKUP_DIR/"
  mv "$sql_file" "$BACKUP_DIR/"

  LAST_DUMP_FILE="$BACKUP_DIR/citytools_pos_FULL_${stamp}.dump"

  log "Backup saved:"
  ls -lh "$BACKUP_DIR/citytools_pos_FULL_${stamp}."*
  echo ""
  echo "Download to PC (run on Windows, not SSH):"
  echo "  scp root@76.13.11.228:${BACKUP_DIR}/citytools_pos_FULL_${stamp}.sql \"C:\\Omar\\Work\\Sahlaa\\City_Tools_System\\\""
}

latest_dump() {
  ls -t "$BACKUP_DIR"/citytools_pos_FULL_*.dump 2>/dev/null | head -1
}

cmd_restore() {
  require_root
  require_postgres
  verify_production_safe
  confirm_isolated

  local dump_file="${1:-}"
  if [ -z "$dump_file" ]; then
    dump_file=$(latest_dump)
  fi
  [ -n "$dump_file" ] || die "No .dump file found in $BACKUP_DIR"
  [ -f "$dump_file" ] || die "Dump not found: $dump_file"

  log "Using dump: $dump_file"
  log "Stopping $TARGET_PM2 only"
  pm2 stop "$TARGET_PM2" 2>/dev/null || true

  log "Recreating $TARGET_DB"
  sudo -u postgres psql <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${TARGET_DB}' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS ${TARGET_DB};
CREATE DATABASE ${TARGET_DB} OWNER ${TARGET_USER};
SQL

  log "Restoring data (pg_restore)"
  sudo -u postgres pg_restore -d "$TARGET_DB" --no-owner --no-privileges "$dump_file" 2>/dev/null || {
    warn "pg_restore reported warnings (often safe — extensions/owners). Continuing..."
  }

  cmd_fix
  cmd_verify
  verify_production_safe
}

cmd_fix() {
  require_root
  [ -d "$BACKEND_DIR" ] || die "Missing $BACKEND_DIR — git pull city-tools-upd first."

  log "Stopping $TARGET_PM2"
  pm2 stop "$TARGET_PM2" 2>/dev/null || true

  log "Schema patches (post-restore)"
  sudo -u postgres psql -d "$TARGET_DB" -f "$SCRIPT_DIR/post-restore-schema-patches.sql"

  log "Prisma migrations (new features not in prod backup)"
  cd "$BACKEND_DIR"
  for m in \
    20260507140651_add_supplier_audit_expenses \
    20260531192227_add_store_fields \
    20260611120000_add_category_store_columns \
    20260613130000_add_show_defective_category
  do
    if [ -f "prisma/migrations/${m}/migration.sql" ]; then
      log "  SQL: $m"
      sudo -u postgres psql -d "$TARGET_DB" -f "prisma/migrations/${m}/migration.sql" \
        2>/dev/null || warn "  (some statements may already exist)"
    fi
  done

  log "Grants for $TARGET_USER"
  sudo -u postgres psql -d "$TARGET_DB" <<SQL
GRANT ALL ON SCHEMA public TO ${TARGET_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${TARGET_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${TARGET_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${TARGET_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ${TARGET_USER};
SQL

  load_target_env
  cd "$BACKEND_DIR"

  log "Prisma migrations (deploy missing tables on restored DB)"
  npx prisma migrate deploy || warn "migrate deploy had warnings — check logs"

  log "Mark any still-pending migrations as applied if SQL already ran manually"
  npx prisma migrate resolve --applied 20260507140651_add_supplier_audit_expenses 2>/dev/null || true
  npx prisma migrate resolve --applied 20260531192227_add_store_fields 2>/dev/null || true
  npx prisma migrate resolve --applied 20260611120000_add_category_store_columns 2>/dev/null || true
  npx prisma migrate resolve --applied 20260613130000_add_show_defective_category 2>/dev/null || true

  log "Ensure ad-hoc website tables (store_trust_features, etc.)"
  bash "$SCRIPT_DIR/ensure-missing-tables.sh" 2>/dev/null || warn "ensure-missing-tables had warnings"

  log "Seed sidebar pages + assign all pages to ADMIN"
  npx ts-node prisma/seed-pages.ts || warn "seed-pages had warnings"
  node <<'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const admin = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!admin) { console.log('No ADMIN role'); return; }
  const pages = await prisma.page.findMany();
  for (const page of pages) {
    await prisma.rolePage.upsert({
      where: { roleId_pageId: { roleId: admin.id, pageId: page.id } },
      update: {},
      create: { roleId: admin.id, pageId: page.id },
    });
  }
  console.log('Assigned', pages.length, 'pages to ADMIN');
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
EOF

  log "Rebuild backend"
  npm run build

  log "Rebuild backoffice"
  cd "$APP_DIR/backoffice"
  npm run build

  if [ -d "$APP_DIR/website" ]; then
    log "Rebuild website"
    cd "$APP_DIR/website"
    npm run build
  fi

  log "Reset admin password (admin / admin123)"
  sudo -u postgres psql -d "$TARGET_DB" -f "$SCRIPT_DIR/reset-admin-password.sql" \
    2>/dev/null || warn "reset-admin-password had warnings"

  log "Seeding website content (hero slides, trust features, delivery zones)..."
  sudo -u postgres psql -d "$TARGET_DB" -f "$SCRIPT_DIR/seed-website-test.sql" \
    2>/dev/null || warn "seed-website-test had warnings"

  log "Restart $TARGET_PM2"
  pm2 restart "$TARGET_PM2" || pm2 start "$TARGET_PM2"

  log "Restart website PM2"
  pm2 restart citytools-website-city-tools 2>/dev/null \
    || pm2 restart city-tools-website 2>/dev/null \
    || warn "website PM2 not found — start manually if needed"

  log "Done. Test: https://city-tools.lamarpos.cloud/backoffice/"
}

cmd_full() {
  cmd_backup
  echo ""
  [ -n "$LAST_DUMP_FILE" ] || die "Backup did not set LAST_DUMP_FILE"
  cmd_restore "$LAST_DUMP_FILE"
}

usage() {
  sed -n '2,30p' "$0" | sed 's/^# \?//'
  exit 1
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    backup)  cmd_backup ;;
    restore) cmd_restore "${1:-}" ;;
    full)    cmd_full ;;
    fix)     cmd_fix ;;
    verify)  cmd_verify ;;
    *)       usage ;;
  esac
}

main "$@"
