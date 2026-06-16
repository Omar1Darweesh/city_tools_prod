#!/bin/bash
# Add citytools.org to nginx (does not modify city-tools.lamarpos.cloud)
set -euo pipefail

SOURCE="/etc/nginx/sites-available/city-tools.lamarpos.cloud"
TARGET="/etc/nginx/sites-available/citytools.org"
ENABLED="/etc/nginx/sites-enabled/citytools.org"

if [ ! -f "$SOURCE" ]; then
  echo "Missing $SOURCE"
  exit 1
fi

cp "$SOURCE" "$TARGET"

# Only change server_name — never touch ssl_certificate paths with a global replace
sed -i 's/server_name city-tools\.lamarpos\.cloud;/server_name citytools.org www.citytools.org;/' "$TARGET"

ln -sf "$TARGET" "$ENABLED"

nginx -t
systemctl reload nginx

echo "OK: HTTP config for citytools.org is active."
echo "Next: certbot --nginx -d citytools.org -d www.citytools.org"
