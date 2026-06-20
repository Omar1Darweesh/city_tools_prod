-- Post-restore patches for citytools_city_tools ONLY.
-- Prod backup (citytools_pos) schema is older than city-tools-upd code.
-- Safe to re-run (IF NOT EXISTS / duplicate_object guards).

BEGIN;

-- ── Categories (website / backoffice) ─────────────────────────────
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#2563eb';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'Wrench';

DO $$ BEGIN
  CREATE UNIQUE INDEX categories_slug_key ON categories(slug);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN duplicate_object THEN NULL;
END $$;

-- ── Sales invoice order status (store / sales API) ────────────────
DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM (
    'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE salesinvoices ADD COLUMN IF NOT EXISTS status "OrderStatus";

UPDATE salesinvoices
SET status = 'DELIVERED'
WHERE status IS NULL;

ALTER TABLE salesinvoices
  ALTER COLUMN status SET DEFAULT 'DELIVERED';

ALTER TABLE salesinvoices
  ALTER COLUMN status SET NOT NULL;

-- ── Platform settings (platforms page / store) ────────────────────
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS show_ratings BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS show_defective_category BOOLEAN NOT NULL DEFAULT false;

-- ── Stock movement enum (store reservations) ──────────────────────
DO $$ BEGIN
  ALTER TYPE "MovementType" ADD VALUE 'RESERVED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Product store columns (may pre-exist from migration SQL) ───────
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_sale BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION NOT NULL DEFAULT 0;

-- ── delivery_zones (website checkout — not in prod backup) ────────
CREATE TABLE IF NOT EXISTS delivery_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    fee NUMERIC(10,2) DEFAULT 0 NOT NULL,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ── Store trust features (in schema but no migration file yet) ─────
CREATE TABLE IF NOT EXISTS store_trust_features (
    id SERIAL PRIMARY KEY,
    icon VARCHAR(50),
    title_en VARCHAR(100) NOT NULL,
    title_ar VARCHAR(100),
    subtitle_en VARCHAR(200),
    subtitle_ar VARCHAR(200),
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;

-- Grants (outside transaction — some PG versions prefer this)
GRANT USAGE ON TYPE "OrderStatus" TO citytools_app;
GRANT USAGE ON TYPE "MovementType" TO citytools_app;
