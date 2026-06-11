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
set -e

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
WEBSITE_PORT=3010

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
check_port_free "$BACKEND_PORT" "city-tools API"
check_port_free "$WEBSITE_PORT" "city-tools website"

if [ -d "$PROTECTED_APP_DIR" ]; then
    echo "Old production folder exists at $PROTECTED_APP_DIR — will NOT be modified."
fi

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
echo "--- Step 1: System packages (shared install only, no config changes) ---"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js $(node -v) already installed."
fi

if ! command -v psql &>/dev/null; then
    apt-get install -y postgresql postgresql-contrib
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
    apt-get install -y nginx
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
SQL

echo "Database '$DB_NAME' ready. Production DB '$PROTECTED_DB' was NOT touched."

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

DATABASE_URL="postgresql://$DB_USER:$DB_PASS_ENCODED@localhost:5432/$DB_NAME?schema=public"

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

echo "PM2 started. Other PM2 apps (e.g. $PROTECTED_PM2) were NOT touched."
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

nginx -t && systemctl reload nginx
echo "nginx reloaded. Only $NGINX_SITE was written."

echo ""
echo "--- Step 10: SSL for $DOMAIN only ---"

if ! command -v certbot &>/dev/null; then
    apt-get install -y certbot python3-certbot-nginx -qq
fi

certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>/dev/null \
    || echo "Certbot note: run manually if needed: certbot --nginx -d $DOMAIN"

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
