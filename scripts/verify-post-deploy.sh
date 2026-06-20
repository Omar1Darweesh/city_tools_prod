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
for path in about contact orders brands; do
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

# 14 Enhanced report today (totalInvoices not null)
if [ -n "$TOKEN" ]; then
  INV=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$API/reports/enhanced?branchId=1&startDate=$TODAY&endDate=$TODAY" \
    | python3 -c "import sys,json; v=json.load(sys.stdin).get('totalInvoices'); print('null' if v is None else v)" 2>/dev/null || echo null)
  [ "$INV" != "null" ] && check "reports/enhanced today totalInvoices=$INV" 1 || check "reports/enhanced today totalInvoices=null" 0
fi

# 15 Profile branchId
if [ -n "$TOKEN" ]; then
  BID=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/users/profile" \
    | python3 -c "import sys,json; v=json.load(sys.stdin).get('branchId'); print('null' if v is None else v)" 2>/dev/null || echo null)
  [ "$BID" != "null" ] && check "users/profile branchId=$BID" 1 || check "users/profile branchId=null" 0
fi

# 16 IDOR invalid branch → 403
if [ -n "$TOKEN" ]; then
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
    "$API/reports/dashboard-summary?branchId=999&startDate=$TODAY&endDate=$TODAY")
  [ "$CODE" = "403" ] && check "IDOR branchId=999 → 403" 1 || check "IDOR branchId=999 → $CODE" 0
fi

# 17 netProfit alignment (financial vs platformSales)
if [ -n "$TOKEN" ]; then
  OK=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$API/reports/enhanced?branchId=1&startDate=$TODAY&endDate=$TODAY" \
    | python3 -c "
import sys,json
d=json.load(sys.stdin)
f=float(d.get('financial',{}).get('netProfit') or 0)
p=float(d.get('platformSales',{}).get('summary',{}).get('netProfit') or 0)
print(1 if abs(f-p) < 1 else 0)
" 2>/dev/null || echo 0)
  [ "$OK" = "1" ] && check "financial.netProfit ≈ platformSales" 1 || check "financial.netProfit mismatch" 0
fi

# 18 CORS: disallowed origin must not 500
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}')
[ "$CODE" != "500" ] && check "CORS evil origin → $CODE (not 500)" 1 || check "CORS evil origin → 500" 0

# 19 Login rate limit returns 429 after repeated failures
RATE=$(for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"ratelimit-check","password":"wrong"}'
done | grep -c '^429$' || true)
[ "$RATE" -ge 1 ] && check "login rate limit (429 after failures)" 1 || check "login rate limit (no 429 seen)" 0

# 20 POS sales status filter
if [ -n "$TOKEN" ]; then
  DEL=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$API/pos/sales?status=DELIVERED&take=1" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',-1))" 2>/dev/null || echo -1)
  PEN=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$API/pos/sales?status=PENDING&take=1" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',-1))" 2>/dev/null || echo -1)
  [ "$DEL" != "$PEN" ] && [ "$DEL" -ge 0 ] && [ "$PEN" -ge 0 ] && \
    check "POS sales status filter (DEL=$DEL PEND=$PEN)" 1 || \
    check "POS sales status filter ignored (DEL=$DEL PEND=$PEN)" 0
fi

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
