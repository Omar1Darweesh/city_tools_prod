#!/bin/bash
# Fix hreflang http:// links — add X-Forwarded-Proto to the Next.js proxy block.
# Run on VPS: bash /root/city-tools/scripts/patch-nginx-forwarded-proto.sh
set -euo pipefail

patch_site() {
  local SITE="$1"
  [ -f "$SITE" ] || { echo "Skip (not found): $SITE"; return; }

  if awk '/location \//{inloc=1} inloc && /proxy_set_header X-Forwarded-Proto/{found=1} inloc && /^[[:space:]]*}/{if(inloc && !found && /proxy_pass/){need=1} inloc=0; found=0} END{exit !need}' "$SITE" 2>/dev/null; then
    :
  fi

  # Simpler check: website proxy block missing X-Forwarded-Proto after proxy_pass to :3012
  if grep -q 'proxy_pass http://127.0.0.1:3012' "$SITE"; then
    if grep -A8 'proxy_pass http://127.0.0.1:3012' "$SITE" | grep -q 'X-Forwarded-Proto'; then
      echo "Already patched: $SITE"
      return
    fi
    sed -i '/proxy_pass http:\/\/127.0.0.1:3012/a\        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_set_header X-Forwarded-Host $host;' "$SITE"
    echo "Patched: $SITE"
  else
    echo "No website proxy on port 3012 in: $SITE"
  fi
}

patch_site "/etc/nginx/sites-available/citytools.org"
patch_site "/etc/nginx/sites-available/city-tools.lamarpos.cloud"

nginx -t
systemctl reload nginx
echo "Done. Verify hreflang uses https:"
echo "  curl -sI https://citytools.org/en/products/INVALID-CODE | grep -i link"
