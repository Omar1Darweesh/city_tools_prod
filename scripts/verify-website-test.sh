#!/bin/bash
# Verify website ↔ API ↔ DB on city-tools test stack
BASE="https://city-tools.lamarpos.cloud/api/store"

echo "=== Health ==="
curl -s -o /dev/null -w "Website: %{http_code}\n" https://city-tools.lamarpos.cloud/
curl -s -o /dev/null -w "API root: %{http_code}\n" https://city-tools.lamarpos.cloud/api

echo ""
echo "=== Store endpoints ==="
for path in \
  "categories" \
  "products?limit=3" \
  "products/popular" \
  "products/best-selling" \
  "statistics/active" \
  "discount-cards/active" \
  "trust-features/active" \
  "delivery-zones?activeOnly=true"; do
  code=$(curl -s -o /tmp/out.json -w "%{http_code}" "$BASE/$path")
  count=$(python3 -c "import json;d=json.load(open('/tmp/out.json')); print(len(d.get('data',d.get('data',[])) if isinstance(d.get('data'),list) else d.get('total','?')))" 2>/dev/null || echo "?")
  echo "$path -> HTTP $code (items: $count)"
done

echo ""
echo "=== PM2 (city-tools only) ==="
pm2 list | grep -E "city-tools|citytools-backend-city|citytools-website-city" || true
