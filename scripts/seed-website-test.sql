-- Seed website content for citytools_city_tools (TEST DB ONLY)
-- Run: sudo -u postgres psql -d citytools_city_tools -f /root/city-tools/scripts/seed-website-test.sql

BEGIN;

-- Fix MovementType enum (backup missing RESERVED — breaks store product stock queries)
DO $$ BEGIN
  ALTER TYPE "MovementType" ADD VALUE 'RESERVED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
GRANT USAGE ON TYPE "MovementType" TO citytools_app;

-- Product store columns (backup predates migration 20260531192227)
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_sale BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE store_discount_cards ADD COLUMN IF NOT EXISTS bg_image VARCHAR(300) DEFAULT '/assets/discountCards/11.jpg';

-- Clear previous seed (test DB — safe to wipe store content tables)
TRUNCATE store_discount_cards RESTART IDENTITY CASCADE;
TRUNCATE store_statistics RESTART IDENTITY CASCADE;
TRUNCATE store_trust_features RESTART IDENTITY CASCADE;
DELETE FROM delivery_zones;

CREATE TABLE IF NOT EXISTS store_hero_slides (
  id SERIAL PRIMARY KEY,
  bg_img VARCHAR(500) NOT NULL DEFAULT '/assets/1.jpg',
  tag_en VARCHAR(100) DEFAULT '',
  tag_ar VARCHAR(100) DEFAULT '',
  title_en VARCHAR(255) DEFAULT '',
  title_ar VARCHAR(255) DEFAULT '',
  sub_en VARCHAR(500) DEFAULT '',
  sub_ar VARCHAR(500) DEFAULT '',
  accent VARCHAR(50) DEFAULT '#C0161B',
  bg_gradient VARCHAR(200) DEFAULT 'from-[#0f1923] via-[#1a2535] to-[#0f1923]',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
TRUNCATE store_hero_slides RESTART IDENTITY CASCADE;

-- Discount cards
INSERT INTO store_discount_cards (badge_en, badge_ar, title_en, title_ar, desc_en, desc_ar, link_url, link_label_en, link_label_ar, bg_color, bg_image, active, sort_order, created_at, updated_at)
VALUES
  ('Hot Deal', 'عرض ساخن', 'Power Tools Sale', 'خصم على الأدوات الكهربائية', 'Up to 25% off on drills, grinders & more', 'خصم حتى 25% على المثاقب والصاروخ وغيرها', '/products?category=total', 'Shop Now', 'تسوق الآن', '#C0161B', '/assets/discountCards/11.jpg', true, 1, NOW(), NOW()),
  ('New', 'جديد', 'Wholesale Prices', 'أسعار الجملة', 'Special rates for contractors & bulk orders', 'أسعار خاصة للمقاولين والطلبات بالجملة', '/products', 'View Products', 'عرض المنتجات', '#1a2535', '/assets/discountCards/12.jpg', true, 2, NOW(), NOW()),
  ('Limited', 'محدود', 'Free Delivery', 'توصيل مجاني', 'Free delivery on orders over 2000 EGP in Cairo', 'توصيل مجاني للطلبات فوق 2000 جنيه داخل القاهرة', '/products', 'Order Now', 'اطلب الآن', '#2563eb', '/assets/discountCards/13.jpg', true, 3, NOW(), NOW());

-- Statistics
INSERT INTO store_statistics (value, label_en, label_ar, sort_order, active, created_at, updated_at)
VALUES
  ('1000+', 'Products', 'منتج', 1, true, NOW(), NOW()),
  ('500+', 'Happy Customers', 'عميل سعيد', 2, true, NOW(), NOW()),
  ('15+', 'Years Experience', 'سنة خبرة', 3, true, NOW(), NOW()),
  ('24/7', 'Support', 'دعم فني', 4, true, NOW(), NOW());

-- Trust features (مميزات الموقع)
INSERT INTO store_trust_features (icon, title_en, title_ar, subtitle_en, subtitle_ar, sort_order, active, created_at, updated_at)
VALUES
  ('Shield', 'Genuine Products', 'منتجات أصلية', '100% authentic tools from trusted brands', 'أدوات أصلية 100% من ماركات موثوقة', 1, true, NOW(), NOW()),
  ('Truck', 'Fast Delivery', 'توصيل سريع', 'Delivery across Cairo & Giza within 24-48h', 'توصيل داخل القاهرة والجيزة خلال 24-48 ساعة', 2, true, NOW(), NOW()),
  ('CreditCard', 'Secure Payment', 'دفع آمن', 'Cash on delivery & secure online payment', 'الدفع عند الاستلام وطرق دفع آمنة', 3, true, NOW(), NOW()),
  ('Headphones', 'Expert Support', 'دعم متخصص', 'Technical advice from our tool specialists', 'استشارات فنية من متخصصي الأدوات', 4, true, NOW(), NOW());

-- Delivery zones (مناطق التوصيل)
INSERT INTO delivery_zones (name, name_ar, fee, active, sort_order)
VALUES
  ('Cairo - Downtown', 'القاهرة - وسط البلد', 50.00, true, 1),
  ('Cairo - Nasr City', 'القاهرة - مدينة نصر', 60.00, true, 2),
  ('Giza', 'الجيزة', 70.00, true, 3),
  ('6th of October', '6 أكتوبر', 80.00, true, 4),
  ('Alexandria', 'الإسكندرية', 120.00, true, 5);

-- Hero carousel slides
INSERT INTO store_hero_slides (bg_img, tag_en, tag_ar, title_en, title_ar, sub_en, sub_ar, accent, sort_order, active, created_at, updated_at)
VALUES
  ('/assets/1.jpg', 'City Tools', 'سيتي تولز', 'Professional Power Tools', 'أدوات كهربائية احترافية', 'Best prices in Egypt', 'أفضل الأسعار في مصر', '#C0161B', 1, true, NOW(), NOW()),
  ('/assets/2.jpg', 'Sale', 'تخفيضات', 'Up to 25% Off', 'خصم حتى 25%', 'On selected TOTAL & APT tools', 'على أدوات TOTAL و APT', '#2563eb', 2, true, NOW(), NOW());

-- Reset product flags then set featured products by code (real backup products)
UPDATE products SET is_popular = false, is_best_sale = false;

UPDATE products SET is_popular = true, rating = 4.5
WHERE code IN ('TG1091366', 'th116386', 'TG109125565', 'TS11218576', 'TG55061', 'TD614006');

UPDATE products SET is_best_sale = true, rating = 4.7
WHERE code IN ('TG10711556', 'TS3006', 'TG109125565', 'WWQ1D12', 'TT5006-2', 'TG2006');

-- Add sale badge + discount on a few popular items
UPDATE products SET
  discount_price = ROUND(price_retail * 0.85, 2),
  badge = 'SALE',
  description = COALESCE(description, 'أداة كهربائية احترافية من City Tools — جودة عالية وضمان.')
WHERE code IN ('TG1091366', 'TG10711556', 'TG109125565', 'TS11218576');

COMMIT;

-- Verify counts
SELECT 'popular' AS type, COUNT(*) FROM products WHERE is_popular = true
UNION ALL SELECT 'best_sale', COUNT(*) FROM products WHERE is_best_sale = true
UNION ALL SELECT 'discount_cards', COUNT(*) FROM store_discount_cards WHERE active = true
UNION ALL SELECT 'statistics', COUNT(*) FROM store_statistics WHERE active = true
UNION ALL SELECT 'trust_features', COUNT(*) FROM store_trust_features WHERE active = true
UNION ALL SELECT 'delivery_zones', COUNT(*) FROM delivery_zones WHERE active = true
UNION ALL SELECT 'hero_slides', COUNT(*) FROM store_hero_slides WHERE active = true;
