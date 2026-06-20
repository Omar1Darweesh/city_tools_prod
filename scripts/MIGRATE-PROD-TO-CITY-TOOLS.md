# Production → City-Tools migration runbook

Copy **live client data** from the original system into the **new isolated stack** without touching production.

| | Original (do not modify) | New stack |
|---|---|---|
| URL | `citytools.lamarpos.cloud` | `city-tools.lamarpos.cloud` |
| Code | `/root/citytools` | `/root/city-tools` |
| Database | `citytools_pos` | `citytools_city_tools` |
| PM2 | `citytools-backend` | `citytools-backend-city-tools` |

---

## One-command workflow (on VPS)

```bash
cd /root/city-tools
git pull origin city-tools-upd
chmod +x scripts/migrate-prod-to-city-tools.sh

# Full cycle: backup prod → restore to new DB → fix schema → rebuild
./scripts/migrate-prod-to-city-tools.sh full
```

Type **`YES`** when prompted.

---

## Step-by-step (recommended for first time)

### 1. Backup only (read-only — safe anytime)

```bash
./scripts/migrate-prod-to-city-tools.sh backup
```

Files land in `/root/backups/original/`:

- `citytools_pos_FULL_YYYY-MM-DD_HHMMSS.dump` — use for restore
- `citytools_pos_FULL_YYYY-MM-DD_HHMMSS.sql` — human-readable archive

Download to your PC (run on **Windows**, not inside SSH):

```powershell
scp root@76.13.11.228:/root/backups/original/citytools_pos_FULL_*.sql "C:\Omar\Work\Sahlaa\City_Tools_System\"
```

### 2. Restore + fix (uses latest `.dump` automatically)

```bash
./scripts/migrate-prod-to-city-tools.sh restore
```

Or a specific file:

```bash
./scripts/migrate-prod-to-city-tools.sh restore /root/backups/original/citytools_pos_FULL_2026-06-20_173129.dump
```

### 3. Verify counts match

```bash
./scripts/migrate-prod-to-city-tools.sh verify
```

`products`, `salesinvoices`, `customers`, etc. should match between `citytools_pos` and `citytools_city_tools`.

### 4. Re-run fixes without restoring (after code update)

```bash
./scripts/migrate-prod-to-city-tools.sh fix
```

---

## What the script does automatically

1. **backup** — `pg_dump` of `citytools_pos` (no writes to prod)
2. **restore** — drop/recreate `citytools_city_tools`, `pg_restore`
3. **post-restore-schema-patches.sql** — columns missing from old prod schema (`status`, `show_ratings`, categories, …)
4. **Prisma migrations** — expenses, store fields, supplier tables, …
5. **GRANT** — permissions for `citytools_app`
6. **seed-pages** — sidebar menu + ADMIN page access
7. **build** — backend + backoffice, restart `citytools-backend-city-tools`

---

## Optional: website demo content

After restore, seed store homepage content (test DB only):

```bash
sudo -u postgres psql -d citytools_city_tools -f /root/city-tools/scripts/seed-website-test.sql
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Permission denied` on tables | `./scripts/migrate-prod-to-city-tools.sh fix` |
| Platforms 500 / `show_ratings` | Re-run `fix` (applies schema patches) |
| Sidebar pages missing | Re-run `fix` (seed-pages + ADMIN assign) |
| Prisma touched wrong DB | Ensure `/root/city-tools/backend/.env` uses `citytools_city_tools` |
| `pg_dump: could not write` | Script uses `/tmp` first — already handled |

---

## Safety rules

- **Never** run restore against `citytools_pos`
- **Never** `git pull` or migrate inside `/root/citytools` unless fixing original intentionally
- Always run **`verify`** after restore
- Keep at least one `.dump` in `/root/backups/original/` before each restore
