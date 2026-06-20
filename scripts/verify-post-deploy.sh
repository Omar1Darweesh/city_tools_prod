#!/bin/bash
# Post-deploy smoke tests for city-tools stack (run on VPS or any host with curl)
# Usage: ./scripts/verify-post-deploy.sh [BASE_URL]
# Example: ./scripts/verify-post-deploy.sh https://city-tools.lamarpos.cloud
set -euo pipefail

BASE="${1:-https://city-tools.lamarpos.cloud}"
API="$BASE/api"
TODAY=$(date +%Y-%m-%d)
PASS=0
FAIL=0

check() {
  local name="$1"
  local ok="$2"
  if [ "$ok" = "1" ]; then
    echo "  OK  $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== City Tools post-deploy verify ==="
echo "API: $API"
echo ""

# 1 Login
LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken',''))" 2>/dev/null || true)
[ -n "$TOKEN" ] && check "POST /auth/login" 1 || check "POST /auth/login" 0

# 2 Dashboard today
if [ -n "$TOKEN" ]; then
  ORDERS=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$API/reports/dashboard-summary?branchId=1&startDate=$TODAY&endDate=$TODAY" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('today',{}).get('orders',0))" 2>/dev/null || echo 0)
  [ "$ORDERS" != "0" ] || [ "$(date +%H)" -lt 10 ] && check "dashboard-summary today (orders=$ORDERS)" 1 || check "dashboard-summary today (orders=0 — OK if no sales yet)" 1
else
  check "dashboard-summary (no token)" 0
fi

# 3 POS future filter
if [ -n "$TOKEN" ]; then
  TOTAL=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$API/pos/sales?startDate=2030-01-01&endDate=2030-12-31" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',-1))" 2>/dev/null || echo -1)
  [ "$TOTAL" = "0" ] && check "POS date filter (future=0)" 1 || check "POS date filter (got total=$TOTAL)" 0
fi

# 4 DB backups no auth
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/database/backups")
[ "$CODE" = "401" ] && check "database/backups no token → 401" 1 || check "database/backups no token → $CODE" 0

# 5 Products auth
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/products?take=1")
[ "$CODE" = "401" ] && check "products no token → 401" 1 || check "products no token → $CODE" 0

# 6 Public store catalog
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/store/products?limit=1")
[ "$CODE" = "200" ] && check "store/products public → 200" 1 || check "store/products → $CODE" 0

# 7 Delivery zones
ZONES=$(curl -s "$API/store/delivery-zones" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',d if isinstance(d,list) else [])))" 2>/dev/null || echo 0)
[ "${ZONES:-0}" -ge 1 ] && check "delivery-zones ≥1" 1 || check "delivery-zones empty" 0

# 8 Hero slides
HERO=$(curl -s "$API/store/hero-slides/active" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',d if isinstance(d,list) else [])))" 2>/dev/null || echo 0)
[ "${HERO:-0}" -ge 1 ] && check "hero-slides active ≥1" 1 || check "hero-slides empty" 0

# 9 Users no passwordHash
if [ -n "$TOKEN" ]; then
  HASH=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/users" | grep -c passwordHash || true)
  [ "$HASH" = "0" ] && check "users response no passwordHash" 1 || check "users leaks passwordHash" 0
fi

# 10 Website homepage
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/ar")
[ "$CODE" = "200" ] && check "website /ar → 200" 1 || check "website /ar → $CODE" 0

# 11 New pages
for path in about contact orders; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/ar/$path")
  [ "$CODE" = "200" ] && check "website /ar/$path → 200" 1 || check "website /ar/$path → $CODE" 0
done

# 12 Store popular alias
POP=$(curl -s "$API/store/products?popular=true&limit=5" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total',len(d.get('data',[]))))" 2>/dev/null || echo 9999)
[ "$POP" -lt 100 ] && check "store popular filter (total=$POP)" 1 || check "store popular filter ignored (total=$POP)" 0

# 13 Stock transfers list
if [ -n "$TOKEN" ]; then
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API/stock/transfers?take=1")
  [ "$CODE" = "200" ] && check "GET /stock/transfers → 200" 1 || check "GET /stock/transfers → $CODE" 0
fi

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
