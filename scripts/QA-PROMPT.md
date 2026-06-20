# QA Prompt — City Tools New Stack

Copy everything below the line into Claude (or any QA agent) after each deploy or prod refresh.

---

You are QA for **City Tools new stack**. Do not modify the **original** system.

## Systems

| | Original (read-only) | New stack (test target) |
|---|---|---|
| URL | https://citytools.lamarpos.cloud | https://city-tools.lamarpos.cloud **and** https://citytools.org |
| Backoffice | root | `/backoffice/` |
| DB | `citytools_pos` | `citytools_city_tools` |
| Login | (do not use for new stack) | `admin` / `admin123` |

## Your task

1. Run API tests against **both** base URLs if DNS allows (at minimum `city-tools.lamarpos.cloud`).
2. Run `./scripts/verify-post-deploy.sh` on the VPS if SSH access is available.
3. Report PASS/FAIL per item with actual response snippets.
4. Classify: **Critical** (blocks go-live), **Major**, **Minor**.

## Automated script (on VPS)

```bash
cd /root/city-tools
git pull origin city-tools-upd
chmod +x scripts/verify-post-deploy.sh
./scripts/verify-post-deploy.sh https://city-tools.lamarpos.cloud
./scripts/verify-post-deploy.sh https://citytools.org
```

## Manual checklist

### Auth & security
- [ ] `POST /api/auth/login` admin/admin123 → 200 + `accessToken`
- [ ] `GET /api/database/backups` **without** token → **401**
- [ ] `GET /api/products?take=1` without token → **401**
- [ ] `GET /api/users` with token → response has **no** `passwordHash`
- [ ] Non-admin token + `GET /api/reports/dashboard-summary?branchId=999` → **403** (IDOR)

### Reports & POS
- [ ] `GET /api/reports/dashboard-summary?branchId=1&startDate=TODAY&endDate=TODAY` → `today.orders` > 0 if sales exist
- [ ] `GET /api/pos/sales?startDate=2030-01-01&endDate=2030-12-31` → `total: 0`
- [ ] `POST /api/pos/payments` with valid body + token → not 404

### Store (public)
- [ ] `GET /api/store/products?limit=1` → 200
- [ ] `GET /api/store/products?popular=true&limit=10` → total ≤ 20 (not all 1185)
- [ ] `GET /api/store/delivery-zones` → ≥ 1 zone
- [ ] `GET /api/store/hero-slides/active` → ≥ 1 slide
- [ ] `GET /api/store/orders/track?invoiceNo=KNOWN&phone=PHONE` → order or 404

### Backoffice APIs
- [ ] `GET /api/expenses?branchId=1` → 200
- [ ] `GET /api/stock/transfers?take=5` with token → 200
- [ ] `POST /api/products/prices/bulk-update` with token → not 404
- [ ] `GET /api/users/profile` → `branchId` not null, `pages.length` ≥ 15

### Website pages (HTTP 200)
- [ ] `/ar` and `/en` homepage
- [ ] `/ar/products`, `/ar/categories`, `/ar/cart`, `/ar/checkout`
- [ ] `/ar/about`, `/ar/contact`, `/ar/orders`, `/ar/support`

### Financial consistency
- [ ] `GET /api/reports/enhanced` (all-time) → `financial.netProfit` ≈ `platformSales.summary.netProfit` (tax aligned)

### Migration / ops (SSH only)
- [ ] `pm2 list` → `citytools-backend-city-tools` and `citytools-website-city-tools` online
- [ ] `pm2 list` → original `citytools-backend` still online (unchanged)
- [ ] `SELECT COUNT(*) FROM salesinvoices WHERE status IS NULL` → 0
- [ ] Original site https://citytools.lamarpos.cloud → 200

## Output format

```
Overall: GREEN / AMBER / RED

Critical: (list or "none")
Major: (list or "none")
Minor: (list or "none")

Checklist: X/25 passed

Notes: (anything unexpected)
```
