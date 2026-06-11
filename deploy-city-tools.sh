#!/bin/bash
# =============================================================
# City Tools — Full Stack Deployment (staging / new stack)
# Domain:  city-tools.lamarpos.cloud
# DNS:     A  city-tools  →  76.13.11.228
#
# Deploys on ONE domain (path-based):
#   /                 → Website (Next.js)
#   /backoffice/      → Admin panel
#   /pos-client/      → POS cashier
#   /api              → NestJS backend
#
# Optional GoDaddy store domain (prompted at runtime):
#   Points to same VPS → serves website + /api on that domain too
#
# Expected repo layout at APP_DIR:
#   backend/
#   backoffice/
#   pos-client/
#   website/          ← city-tools-store (see WEBSITE_REPO_URL below)
#
# Usage (on the VPS as root):
#   chmod +x deploy-city-tools.sh
#   ./deploy-city-tools.sh
# =============================================================
set -e

# ── Config ────────────────────────────────────────────────────
REPO_URL="https://github.com/Omar1Darweesh/city_tools_prod.git"
BRANCH="city-tools-upd"

# Clone city-tools-store here if not inside main repo (leave empty to skip auto-clone)
WEBSITE_REPO_URL=""
WEBSITE_BRANCH="main"

APP_DIR="/root/city-tools"
DOMAIN="city-tools.lamarpos.cloud"
SERVER_IP="76.13.11.228"

DB_NAME="citytools_city_tools"
DB_USER="citytools_app"
BACKEND_PORT=3021
WEBSITE_PORT=3000

PM2_BACKEND="citytools-backend-city-tools"
PM2_WEBSITE="citytools-website-city-tools"

NGINX_SITE="city-tools.lamarpos.cloud"

echo ""
echo "============================================"
echo "   City Tools — Full Stack Deployment"
echo "   Domain: $DOMAIN"
echo "============================================"
echo ""

# ── Prompts ───────────────────────────────────────────────────
read -sp "Enter PostgreSQL password for user '$DB_USER': " DB_PASS
echo ""
read -sp "Confirm password: " DB_PASS_CONFIRM
echo ""

if [ "$DB_PASS" != "$DB_PASS_CONFIRM" ]; then
    echo "ERROR: Passwords do not match. Exiting."
    exit 1
fi

echo ""
read -p "GoDaddy store domain (e.g. citytools-eg.com) — press Enter to skip: " STORE_DOMAIN
STORE_DOMAIN="${STORE_DOMAIN#https://}"
STORE_DOMAIN="${STORE_DOMAIN#http://}"
STORE_DOMAIN="${STORE_DOMAIN%/}"

read -p "Run database seed after migrate? (y/N): " RUN_SEED
RUN_SEED="${RUN_SEED:-N}"

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
DB_PASS_ENCODED=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DB_PASS")

# Public URLs used in builds
API_URL="https://${DOMAIN}/api"
if [ -n "$STORE_DOMAIN" ]; then
    STORE_PUBLIC_URL="https://${STORE_DOMAIN}"
else
    STORE_PUBLIC_URL="https://${DOMAIN}"
fi

echo ""
echo "--- Step 1: System packages ---"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

if ! command -v node &>/dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js $(node -v) already installed."
fi

if ! command -v psql &>/dev/null; then
    echo "Installing PostgreSQL..."
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
else
    echo "PostgreSQL already installed."
fi

if ! command -v pm2 &>/dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
else
    echo "PM2 already installed."
fi

if ! command -v nginx &>/dev/null; then
    echo "Installing nginx..."
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo "nginx already installed."
fi

echo ""
echo "--- Step 2: PostgreSQL database ---"

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

echo "Database '$DB_NAME' is ready."

echo ""
echo "--- Step 3: Clone / update application code ---"

if [ -d "$APP_DIR/.git" ]; then
    echo "Updating main repository..."
    cd "$APP_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git reset --hard "origin/$BRANCH"
else
    echo "Cloning main repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
    git checkout "$BRANCH"
fi

WEBSITE_DIR="$APP_DIR/website"
if [ ! -f "$WEBSITE_DIR/package.json" ]; then
    if [ -d "$APP_DIR/city-tools-store/package.json" ]; then
        WEBSITE_DIR="$APP_DIR/city-tools-store"
        echo "Using website at $WEBSITE_DIR"
    elif [ -n "$WEBSITE_REPO_URL" ]; then
        echo "Cloning website repository..."
        git clone -b "$WEBSITE_BRANCH" "$WEBSITE_REPO_URL" "$WEBSITE_DIR"
    else
        echo ""
        echo "ERROR: Website not found at $APP_DIR/website or $APP_DIR/city-tools-store"
        echo "Either:"
        echo "  1. Add city-tools-store to your repo as website/"
        echo "  2. Set WEBSITE_REPO_URL at the top of this script"
        echo "  3. Manually copy city-tools-store to $APP_DIR/website before running"
        exit 1
    fi
fi

echo ""
echo "--- Step 4: Environment files ---"

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

echo "Environment files written."
echo "  API:    $API_URL"
echo "  Store:  $STORE_PUBLIC_URL"

echo ""
echo "--- Step 5: Build backend ---"

cd "$APP_DIR/backend"
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
echo "Backend built."

echo ""
echo "--- Step 6: Build backoffice & POS ---"

cd "$APP_DIR/backoffice"
npm install
npm run build
echo "Backoffice built."

cd "$APP_DIR/pos-client"
npm install
npm run build
echo "POS built."

echo ""
echo "--- Step 7: Build website ---"

cd "$WEBSITE_DIR"
npm install
npm run build
echo "Website built."

echo ""
echo "--- Step 8: PM2 processes ---"

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

pm2 delete "$PM2_BACKEND" 2>/dev/null || true
pm2 delete "$PM2_WEBSITE" 2>/dev/null || true
pm2 start "$APP_DIR/ecosystem.city-tools.config.js"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "--- Step 9: nginx ---"

# Build optional GoDaddy server block
STORE_SERVER_BLOCK=""
if [ -n "$STORE_DOMAIN" ]; then
    STORE_SERVER_BLOCK="
server {
    listen 80;
    server_name $STORE_DOMAIN www.$STORE_DOMAIN;

    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
"
fi

tee "/etc/nginx/sites-available/$NGINX_SITE" >/dev/null <<NGINXEOF
# City Tools — single domain stack
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50m;

    # API (must be before other locations)
    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backoffice SPA
    location = /backoffice {
        return 301 /backoffice/;
    }
    location /backoffice/ {
        alias $APP_DIR/backoffice/dist/;
        index index.html;
        try_files \$uri \$uri/ /backoffice/index.html;
    }

    # POS SPA
    location = /pos-client {
        return 301 /pos-client/;
    }
    location /pos-client/ {
        alias $APP_DIR/pos-client/dist/;
        index index.html;
        try_files \$uri \$uri/ /pos-client/index.html;
    }

    # Website (Next.js) — catch-all last
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
$STORE_SERVER_BLOCK
NGINXEOF

ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/$NGINX_SITE"
nginx -t && systemctl reload nginx
echo "nginx configured."

echo ""
echo "--- Step 10: SSL (Let's Encrypt) ---"

CERT_DOMAINS="-d $DOMAIN"
if [ -n "$STORE_DOMAIN" ]; then
    CERT_DOMAINS="$CERT_DOMAINS -d $STORE_DOMAIN -d www.$STORE_DOMAIN"
fi

if ! command -v certbot &>/dev/null; then
    apt-get install -y certbot python3-certbot-nginx -qq
fi

# Only request cert for store domain if DNS already points here
if [ -n "$STORE_DOMAIN" ]; then
    STORE_IP=$(dig +short "$STORE_DOMAIN" | tail -1)
    if [ "$STORE_IP" != "$SERVER_IP" ]; then
        echo "NOTE: $STORE_DOMAIN does not point to $SERVER_IP yet (got: ${STORE_IP:-none})."
        echo "      SSL for GoDaddy domain skipped — run certbot manually after DNS is set."
        CERT_DOMAINS="-d $DOMAIN"
    fi
fi

certbot --nginx $CERT_DOMAINS --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>/dev/null \
    || echo "Certbot warning — site may run on HTTP until DNS/SSL is fixed."

echo ""
echo "--- Step 11: Firewall ---"

if command -v ufw &>/dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable || true
    echo "Firewall updated."
fi

echo ""
echo "--- Step 12: Database seed (optional) ---"

if [[ "$RUN_SEED" =~ ^[Yy]$ ]]; then
    cd "$APP_DIR/backend"
    npx ts-node --transpile-only prisma/seed.ts || echo "Seed finished with warnings."
    echo "Database seeded."
else
    echo "Seed skipped."
fi

echo ""
echo "============================================"
echo "   Deployment Complete!"
echo "============================================"
echo ""
echo "  Website:    $STORE_PUBLIC_URL"
echo "  Backoffice: https://$DOMAIN/backoffice/"
echo "  POS:        https://$DOMAIN/pos-client/"
echo "  API:        $API_URL"
echo ""
if [ -n "$STORE_DOMAIN" ]; then
    echo "  GoDaddy:    Point A record for $STORE_DOMAIN → $SERVER_IP"
    echo "              Then: certbot --nginx -d $STORE_DOMAIN -d www.$STORE_DOMAIN"
    echo ""
fi
echo "  pm2 status"
echo "  pm2 logs $PM2_BACKEND"
echo "  pm2 logs $PM2_WEBSITE"
echo "============================================"
echo ""
