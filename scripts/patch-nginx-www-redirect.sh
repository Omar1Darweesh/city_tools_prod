#!/bin/bash
# Redirect www.citytools.org → citytools.org (canonical non-www).
# Run on VPS: bash /root/city-tools/scripts/patch-nginx-www-redirect.sh
set -euo pipefail

REDIRECT_CONF="/etc/nginx/sites-available/citytools-www-redirect"
ENABLED="/etc/nginx/sites-enabled/citytools-www-redirect"

if [ -f "$ENABLED" ]; then
  echo "Already configured: $ENABLED"
  exit 0
fi

cat > "$REDIRECT_CONF" <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name www.citytools.org;
    return 301 https://citytools.org$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.citytools.org;

    ssl_certificate /etc/letsencrypt/live/citytools.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/citytools.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://citytools.org$request_uri;
}
EOF

ln -sf "$REDIRECT_CONF" "$ENABLED"
nginx -t
systemctl reload nginx
echo "Done. www.citytools.org now redirects to https://citytools.org"
