#!/bin/bash
# =============================================================
# City Tools — ISOLATED test deployment
# ONLY affects: city-tools.lamarpos.cloud
#
# Does NOT touch:
#   - citytools.lamarpos.cloud (old production)
#   - /root/citytools
#   - database citytools_pos
#   - other PM2 apps or nginx site configs
#   - other subdomains (pos, api, order, etc.)
#
# DNS: A  city-tools  →  76.13.11.228
#
# Paths on one domain:
#   /              → Website
#   /backoffice/   → Admin
#   /pos-client/   → POS
#   /api           → Backend
# =============================================================
set -euo pipefail

# ── Isolated config (do not reuse production values) ──────────
REPO_URL="https://github.com/Omar1Darweesh/city_tools_prod.git"
BRANCH="city-tools-upd"

APP_DIR="/root/city-tools"
DOMAIN="city-tools.lamarpos.cloud"
SERVER_IP="76.13.11.228"

# Separate from production: /root/citytools + citytools_pos + port 3020
DB_NAME="citytools_city_tools"
DB_USER="citytools_app"
BACKEND_PORT=3021
WEBSITE_PORT=3012

PM2_BACKEND="citytools-backend-city-tools"
PM2_WEBSITE="citytools-website-city-tools"

NGINX_SITE="city-tools.lamarpos.cloud"
NGINX_AVAILABLE="/etc/nginx/sites-available/$NGINX_SITE"
NGINX_ENABLED="/etc/nginx/sites-enabled/$NGINX_SITE"

# Protected — script must never modify these
PROTECTED_APP_DIR="/root/citytools"
PROTECTED_DB="citytools_pos"
PROTECTED_PM2="citytools-backend"
PROTECTED_NGINX_SITES=(
  "citytools.lamarpos.cloud"
  "default"
)
PROTECTED_PORTS=(3020 3010 8091 5000 80 443)
NGINX_HASH_SNAPSHOT="/tmp/city-tools-nginx-protect.sha256"
PM2_SNAPSHOT="/tmp/city-tools-pm2-before.txt"

snapshot_nginx_integrity() {
    find /etc/nginx/sites-available -type f ! -name "$NGINX_SITE" -print0 2>/dev/null \
        | sort -z | xargs -0 sha256sum 2>/dev/null > "$NGINX_HASH_SNAPSHOT" || true
}

verify_nginx_integrity() {
    local current="/tmp/city-tools-nginx-protect-current.sha256"
    find /etc/nginx/sites-available -type f ! -name "$NGINX_SITE" -print0 2>/dev/null \
        | sort -z | xargs -0 sha256sum 2>/dev/null > "$current" || true
    if [ -f "$NGINX_HASH_SNAPSHOT" ] && [ -f "$current" ]; then
        if ! diff -q "$NGINX_HASH_SNAPSHOT" "$current" >/dev/null 2>&1; then
            echo "ERROR: Another nginx config file was modified. Stopping to protect client projects."
            diff "$NGINX_HASH_SNAPSHOT" "$current" || true
            exit 1
        fi
        echo "OK: All other nginx site configs unchanged."
    fi
}

snapshot_pm2_state() {
    pm2 list 2>/dev/null > "$PM2_SNAPSHOT" || true
}

verify_pm2_protected() {
    if pm2 describe "$PROTECTED_PM2" >/dev/null 2>&1; then
        if pm2 list 2>/dev/null | grep "$PROTECTED_PM2" | grep -q "online"; then
            echo "OK: Client production PM2 '$PROTECTED_PM2' is still online."
        else
            echo "ERROR: '$PROTECTED_PM2' is not online after deploy. Check client apps immediately."
            exit 1
        fi
    else
        echo "Note: '$PROTECTED_PM2' not in PM2 (may use a different process name)."
    fi
    if [ -f "$PM2_SNAPSHOT" ] && [ -f /tmp/city-tools-pm2-after.txt ]; then
        # Ensure no unrelated PM2 app disappeared (count lines with 'online')
        local before after
        before=$(grep -c "online" "$PM2_SNAPSHOT" || echo 0)
        after=$(grep -c "online" /tmp/city-tools-pm2-after.txt || echo 0)
        if [ "$after" -lt "$before" ]; then
            echo "ERROR: PM2 online process count dropped ($before -> $after). Client apps may be affected."
            exit 1
        fi
        echo "OK: PM2 online process count preserved ($after apps)."
    fi
}

check_disk_space() {
    local avail_kb
    avail_kb=$(df --output=avail / | tail -1 | tr -d ' ')
    local min_kb=3145728  # 3 GB
    echo "Disk free: $(( avail_kb / 1024 / 1024 )) GB"
    if [ "$avail_kb" -lt "$min_kb" ]; then
        echo "ERROR: Less than 3 GB free. npm builds can fill disk and break OTHER client projects."
        echo "Free space first (server is ~88% full), then re-run."
        exit 1
    fi
}

check_protected_ports() {
    local port
    for port in 3020 3010 8091; do
        if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
            echo "Protected client port $port is in use (expected for live projects) — will NOT use it."
        fi
    done
    if [ "$BACKEND_PORT" = "3020" ] || [ "$WEBSITE_PORT" = "8091" ] || [ "$WEBSITE_PORT" = "3010" ]; then
        echo "ERROR: city-tools ports must not overlap client ports 3020/3010/8091."
        exit 1
    fi
}

verify_protected_database() {
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$PROTECTED_DB'" 2>/dev/null | grep -q 1; then
        echo "OK: Client database '$PROTECTED_DB' still exists."
    else
        echo "WARNING: Could not verify '$PROTECTED_DB' (may be named differently)."
    fi
}

echo ""
echo "============================================"
echo "   City Tools — ISOLATED Test Deployment"
echo "   Domain ONLY: $DOMAIN"
echo "============================================"
echo ""
echo "This script will ONLY create/update:"
echo "  Folder:   $APP_DIR"
echo "  Database: $DB_NAME (new user: $DB_USER)"
echo "  PM2:      $PM2_BACKEND, $PM2_WEBSITE"
echo "  Ports:    $BACKEND_PORT (API), $WEBSITE_PORT (website)"
echo "  nginx:    $NGINX_AVAILABLE"
echo ""
echo "This script will NOT modify:"
echo "  $PROTECTED_APP_DIR"
echo "  database $PROTECTED_DB"
echo "  PM2 process $PROTECTED_PM2 or any other PM2 app"
echo "  nginx sites for other projects"
echo "  DNS records (you manage those in Hostinger)"
echo ""

read -p "Continue with isolated deploy? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Type 'city-tools' to confirm you accept isolated deploy (other client projects stay live):"
read -r TYPED
if [ "$TYPED" != "city-tools" ]; then
    echo "Aborted — confirmation did not match."
    exit 0
fi

snapshot_nginx_integrity
snapshot_pm2_state

# ── Pre-flight: port availability ─────────────────────────────
check_port_free() {
    local port=$1
    local label=$2
    if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
        local owner
        owner=$(ss -tlnp 2>/dev/null | grep ":${port} " | head -1)
        # Allow if already our own PM2 process restarting
        if echo "$owner" | grep -q "$PM2_BACKEND\|$PM2_WEBSITE"; then
            echo "Port $port ($label) — already used by city-tools stack (will restart)."
            return 0
        fi
        echo "ERROR: Port $port ($label) is already in use by another process:"
        echo "  $owner"
        echo "Change BACKEND_PORT or WEBSITE_PORT in this script, or stop the conflicting app."
        exit 1
    fi
    echo "Port $port ($label) — available."
}

echo ""
echo "--- Pre-flight checks ---"
check_disk_space
check_protected_ports
check_port_free "$BACKEND_PORT" "city-tools API"
check_port_free "$WEBSITE_PORT" "city-tools website"
verify_protected_database

if [ -d "$PROTECTED_APP_DIR" ]; then
    echo "Client folder $PROTECTED_APP_DIR exists — will NOT be modified."
fi

echo ""
echo "Other nginx sites on this server (will NOT be edited):"
ls -1 /etc/nginx/sites-enabled/ 2>/dev/null | grep -v "^${NGINX_SITE}$" || echo "  (none listed)"
echo ""
echo "Current PM2 processes (client apps must stay running):"
pm2 list 2>/dev/null || echo "  PM2 not running yet"

# ── Prompts ───────────────────────────────────────────────────
read -sp "Enter NEW PostgreSQL password for '$DB_USER' (not production DB): " DB_PASS
echo ""
read -sp "Confirm password: " DB_PASS_CONFIRM
echo ""

if [ "$DB_PASS" != "$DB_PASS_CONFIRM" ]; then
    echo "ERROR: Passwords do not match. Exiting."
    exit 1
fi

read -p "Run database seed after migrate? (y/N): " RUN_SEED
RUN_SEED="${RUN_SEED:-N}"

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
DB_PASS_ENCODED=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DB_PASS")

API_URL="https://${DOMAIN}/api"
STORE_PUBLIC_URL="https://${DOMAIN}"

echo ""
echo "--- Step 1: System packages (install missing only — no upgrades) ---"

export DEBIAN_FRONTEND=noninteractive

NEED_APT=false
command -v node &>/dev/null || NEED_APT=true
command -v psql &>/dev/null || NEED_APT=true
command -v pm2 &>/dev/null || NEED_APT=true
command -v nginx &>/dev/null || NEED_APT=true

if [ "$NEED_APT" = true ]; then
    apt-get update -qq
else
    echo "Node, PostgreSQL, PM2, nginx already present — skipping apt-get update."
fi

if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y --no-upgrade nodejs 2>/dev/null || apt-get install -y nodejs
else
    echo "Node.js $(node -v) already installed."
fi

if ! command -v psql &>/dev/null; then
    apt-get install -y --no-upgrade postgresql postgresql-contrib 2>/dev/null || apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
else
    echo "PostgreSQL already installed."
fi

if ! command -v pm2 &>/dev/null; then
    npm install -g pm2
else
    echo "PM2 already installed."
fi

if ! command -v nginx &>/dev/null; then
    apt-get install -y --no-upgrade nginx 2>/dev/null || apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo "nginx already installed."
fi

echo ""
echo "--- Step 2: PostgreSQL — NEW database only ($DB_NAME) ---"

sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
  ELSE
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')
\gexec

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Safety: never drop or alter client production database
-- (this block only creates $DB_NAME if missing)
SQL

verify_protected_database
echo "Database '$DB_NAME' ready. Client DB '$PROTECTED_DB' was NOT modified."

echo ""
echo "--- Step 3: Clone / update code at $APP_DIR only ---"

if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git reset --hard "origin/$BRANCH"
else
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

WEBSITE_DIR="$APP_DIR/website"
if [ ! -f "$WEBSITE_DIR/package.json" ]; then
    echo "ERROR: website/ not found in repo."
    exit 1
fi

echo ""
echo "--- Step 4: Environment files (city-tools only) ---"

cat > "$APP_DIR/backend/.env" <<ENV
PORT=$BACKEND_PORT
HOST=0.0.0.0
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="7h"
REFRESH_TOKEN_EXPIRES_IN="7d"
FRONTEND_URL=https://$DOMAIN

DATABASE_URL="postgresql://$DB_USER:$DB_PASS_ENCODED@localhost:5432/$DB_NAME?schema=public&connection_limit=3"

PGHOST=localhost
PGUSER=$DB_USER
PGPASSWORD=$DB_PASS
PGDATABASE=$DB_NAME
PGPORT=5432

NODE_ENV=production
ENV

cat > "$APP_DIR/backoffice/.env" <<ENV
VITE_API_URL=$API_URL
ENV

cat > "$APP_DIR/pos-client/.env" <<ENV
VITE_API_URL=$API_URL
ENV

cat > "$WEBSITE_DIR/.env.production" <<ENV
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_SITE_URL=$STORE_PUBLIC_URL
PORT=$WEBSITE_PORT
ENV

echo "  API:   $API_URL"
echo "  Store: $STORE_PUBLIC_URL"

echo ""
echo "--- Step 5: Build backend ---"

cd "$APP_DIR/backend"
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

echo ""
echo "--- Step 6: Build backoffice & POS ---"

cd "$APP_DIR/backoffice"
npm install
npm run build

cd "$APP_DIR/pos-client"
npm install
npm run build

echo ""
echo "--- Step 7: Build website ---"

cd "$WEBSITE_DIR"
npm install
npm run build

echo ""
echo "--- Step 8: PM2 — only city-tools processes ---"

MAIN_JS=$(find "$APP_DIR/backend/dist" -name "main.js" | head -1)
if [ -z "$MAIN_JS" ]; then
    echo "ERROR: backend dist/main.js not found."
    exit 1
fi

cat > "$APP_DIR/ecosystem.city-tools.config.js" <<EOF
module.exports = {
  apps: [
    {
      name: '$PM2_BACKEND',
      script: '$MAIN_JS',
      cwd: '$APP_DIR/backend',
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 10000,
      env: { NODE_ENV: 'production' }
    },
    {
      name: '$PM2_WEBSITE',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p $WEBSITE_PORT',
      cwd: '$WEBSITE_DIR',
      env: {
        NODE_ENV: 'production',
        PORT: '$WEBSITE_PORT',
        UPLOAD_PUBLIC_ROOT: '$WEBSITE_DIR/public',
        NEXT_PUBLIC_API_URL: '$API_URL',
        NEXT_PUBLIC_SITE_URL: '$STORE_PUBLIC_URL'
      }
    }
  ]
};
EOF

# Only delete/restart OUR processes — never touch $PROTECTED_PM2
pm2 delete "$PM2_BACKEND" 2>/dev/null || true
pm2 delete "$PM2_WEBSITE" 2>/dev/null || true
pm2 start "$APP_DIR/ecosystem.city-tools.config.js"
pm2 save

pm2 list 2>/dev/null > /tmp/city-tools-pm2-after.txt
verify_pm2_protected
echo "PM2: only '$PM2_BACKEND' and '$PM2_WEBSITE' were (re)started."
pm2 list

echo ""
echo "--- Step 9: nginx — ONLY $NGINX_SITE ---"

tee "$NGINX_AVAILABLE" >/dev/null <<NGINXEOF
# ISOLATED: city-tools test stack only — do not edit other site files
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50m;

    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /uploads/ {
        alias $WEBSITE_DIR/public/uploads/;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    location = /backoffice {
        return 301 /backoffice/;
    }
    location /backoffice/ {
        alias $APP_DIR/backoffice/dist/;
        index index.html;
        try_files \$uri \$uri/ /backoffice/index.html;
    }

    location = /pos-client {
        return 301 /pos-client/;
    }
    location /pos-client/ {
        alias $APP_DIR/pos-client/dist/;
        index index.html;
        try_files \$uri \$uri/ /pos-client/index.html;
    }

    location / {
        proxy_pass http://127.0.0.1:$WEBSITE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"

# Safety: verify we did not overwrite protected nginx configs
for protected in "${PROTECTED_NGINX_SITES[@]}"; do
    if [ "$protected" = "$NGINX_SITE" ]; then
        continue
    fi
    if [ -f "/etc/nginx/sites-available/$protected" ]; then
        echo "Protected nginx site still present: $protected"
    fi
done

verify_nginx_integrity

if ! nginx -t; then
    echo "ERROR: nginx test failed. NOT reloading — client sites stay on old config."
    exit 1
fi
systemctl reload nginx
verify_nginx_integrity
echo "nginx reloaded safely. Only $NGINX_SITE was written."

echo ""
echo "--- Step 10: SSL for $DOMAIN only (does not touch other certificates) ---"

if ! command -v certbot &>/dev/null; then
    apt-get install -y --no-upgrade certbot python3-certbot-nginx -qq 2>/dev/null \
        || apt-get install -y certbot python3-certbot-nginx -qq
fi

certbot --nginx -d "$DOMAIN" --cert-name "$DOMAIN" \
    --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>/dev/null \
    || echo "Certbot note: run manually if needed: certbot --nginx -d $DOMAIN"

verify_nginx_integrity

echo ""
echo "--- Step 11: Firewall (add rules only, skip if ufw not used) ---"

if command -v ufw &>/dev/null && ufw status 2>/dev/null | grep -q "Status: active"; then
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    echo "UFW rules ensured for 80/443 (already active — not re-enabled)."
elif command -v ufw &>/dev/null; then
    echo "UFW inactive — skipping firewall changes to avoid affecting other projects."
else
    echo "UFW not installed — skipping."
fi

echo ""
echo "--- Step 12: Database seed (optional) ---"

if [[ "$RUN_SEED" =~ ^[Yy]$ ]]; then
    cd "$APP_DIR/backend"
    npx ts-node --transpile-only prisma/seed.ts || echo "Seed finished with warnings."
else
    echo "Seed skipped."
fi

echo ""
echo "--- Post-deploy: verify client production still responds ---"
if command -v curl &>/dev/null; then
    PROD_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://citytools.lamarpos.cloud" || echo "000")
    TEST_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$DOMAIN" || echo "000")
    echo "  citytools.lamarpos.cloud (clients): HTTP $PROD_CODE"
    echo "  $DOMAIN (test):                    HTTP $TEST_CODE"
    if [ "$PROD_CODE" = "000" ]; then
        echo "  WARNING: Could not reach client production URL — check manually."
    fi
else
    echo "  Install curl to auto-check client URLs."
fi

verify_pm2_protected
verify_nginx_integrity

echo ""
echo "============================================"
echo "   Isolated Deployment Complete"
echo "============================================"
echo ""
echo "  TEST URLs (city-tools only):"
echo "    Website:    https://$DOMAIN/"
echo "    Backoffice: https://$DOMAIN/backoffice/"
echo "    POS:        https://$DOMAIN/pos-client/"
echo "    API:        $API_URL"
echo ""
echo "  UNTOUCHED:"
echo "    https://citytools.lamarpos.cloud (old production)"
echo "    /root/citytools"
echo "    database $PROTECTED_DB"
echo ""
echo "  GoDaddy domain: configure separately later (not in this script)."
echo ""
echo "  pm2 logs $PM2_BACKEND"
echo "  pm2 logs $PM2_WEBSITE"
echo "============================================"
echo ""
