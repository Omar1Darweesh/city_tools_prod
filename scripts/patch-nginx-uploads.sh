#!/bin/bash
# Serve uploaded product/hero images directly from disk (test stack only)
# Run on VPS: bash /root/city-tools/scripts/patch-nginx-uploads.sh

set -e
NGINX_SITE="/etc/nginx/sites-available/city-tools.lamarpos.cloud"
UPLOADS_DIR="/root/city-tools/website/public/uploads"

mkdir -p "$UPLOADS_DIR/products" "$UPLOADS_DIR/hero-slides"

if grep -q 'location /uploads/' "$NGINX_SITE" 2>/dev/null; then
  echo "nginx already has /uploads/ location"
else
  sed -i '/location \/api {/i\
    location /uploads/ {\
        alias /root/city-tools/website/public/uploads/;\
        expires 30d;\
        add_header Cache-Control "public";\
        access_log off;\
    }\
' "$NGINX_SITE"
  echo "Added /uploads/ location to nginx"
fi

nginx -t && systemctl reload nginx
echo "Done. Test: curl -I https://city-tools.lamarpos.cloud/uploads/products/"
