# City Tools New Stack — Status (2026-06-20)

## Domains & URLs

| Purpose | URL | Notes |
|---------|-----|--------|
| **Primary website** | [https://citytools.org](https://citytools.org) | Public storefront (ar/en) |
| **Staging / VPS path** | [https://city-tools.lamarpos.cloud](https://city-tools.lamarpos.cloud) | Same stack, nginx path prefix |
| **Backoffice** | `/backoffice/` on either domain | `admin` / `admin123` |
| **POS client** | `/pos-client/` | JWT required |
| **Original live (DO NOT TOUCH)** | [https://citytools.lamarpos.cloud](https://citytools.lamarpos.cloud) | Old stack, `citytools_pos` DB |

Both `citytools.org` and `city-tools.lamarpos.cloud` should point at the **same** PM2 website + backend when DNS/nginx are configured.

---

## Deployment map

| Component | Path / PM2 | DB |
|-----------|------------|-----|
| Backend | `citytools-backend-city-tools` :3021 | `citytools_city_tools` |
| Website | `citytools-website-city-tools` :3012 | — |
| Code | `/root/city-tools` | branch `city-tools-upd` |
| Git remote | `github.com/Omar1Darweesh/city_tools_prod` | |

---

## Completed ✅

### Security & critical (C1–C5)
- Database backup routes → JWT + ADMIN (401 without token)
- Reports/POS Egypt date-range parsing (today works with same start/end)
- Users API strips `passwordHash`
- POST `/api/pos/payments` live
- Products API requires auth

### Data & migration
- Prod data restored (~1185 products, full sales history)
- `migrate-prod-to-city-tools.sh` — backup, restore, fix, verify, `AUTO_YES=1`
- Auto seed: hero slides, trust features, delivery zones, admin password
- Website + backend PM2 restart in `cmd_fix`

### Major fixes (latest batch)
- **M1** Reports branch IDOR — non-admin blocked; invalid branchId → 403
- **M2** Financial `netProfit` now deducts tax (matches platform sales)
- **M5** `GET /api/stock/transfers` list endpoint
- **m4** `?popular=true` maps to `isBestSale` on store products
- **m3** `profile.branchId` falls back to `branch.id` when DB scalar is null
- **C2** `reports/enhanced` same-day dates + top-level `totalInvoices` / `grossSales`
- **Website** `/ar/about`, `/ar/contact`, `/ar/orders` (track by invoice)
- **API** `GET /api/store/orders/track?invoiceNo=&phone=`

### Verified live (2026-06-20)
- C1: backups → 401
- C2: dashboard today → 21 orders
- C3: POS future dates → total 0
- Login admin/admin123 → token OK
- Hero slides seeded → 2

---

## Remaining / optional polish

| Item | Priority | Notes |
|------|----------|--------|
| Role guards on all sensitive routes | Medium | Only backup uses ADMIN guard today |
| Brand duplicate cleanup (JADEVER/jadever) | Low | Data SQL fix |
| `offine` channel typo (9 invoices) | Low | Historical data |
| Full 15-item SQL checks via SSH | Medium | null status, enum RESERVED |
| `citytools.org` nginx/DNS parity | Ops | Ensure same build as lamarpos path |
| Customer order track rate-limit | Low | Public track endpoint |

---

## Quick deploy after pull

```bash
cd /root/city-tools && git pull origin city-tools-upd
cd backend && npm run build && pm2 restart citytools-backend-city-tools
cd ../website && npm run build && pm2 restart citytools-website-city-tools
chmod +x scripts/verify-post-deploy.sh
./scripts/verify-post-deploy.sh https://city-tools.lamarpos.cloud
```

For website-only domain:
```bash
./scripts/verify-post-deploy.sh https://citytools.org
```

---

## Migration script commands

```bash
./scripts/migrate-prod-to-city-tools.sh backup
./scripts/migrate-prod-to-city-tools.sh restore
AUTO_YES=1 ./scripts/migrate-prod-to-city-tools.sh full
./scripts/migrate-prod-to-city-tools.sh fix
./scripts/migrate-prod-to-city-tools.sh verify
```
