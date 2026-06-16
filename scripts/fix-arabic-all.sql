-- Fix ALL Arabic store content on test DB (UTF-8 safe via psql)
-- Run on VPS: sudo -u postgres psql -d citytools_city_tools -f /root/city-tools/scripts/fix-arabic-all.sql

-- Statistics
UPDATE store_statistics SET label_ar = 'منتج' WHERE id = 1;
UPDATE store_statistics SET label_ar = 'عميل سعيد' WHERE id = 2;
UPDATE store_statistics SET label_ar = 'سنة خبرة' WHERE id = 3;
UPDATE store_statistics SET label_ar = 'دعم فني' WHERE id = 4;

-- Trust features
UPDATE store_trust_features SET title_ar = 'منتجات أصلية', subtitle_ar = 'أدوات أصلية 100% من ماركات موثوقة' WHERE id = 1;
UPDATE store_trust_features SET title_ar = 'توصيل سريع', subtitle_ar = 'توصيل داخل القاهرة والجيزة خلال 24-48 ساعة' WHERE id = 2;
UPDATE store_trust_features SET title_ar = 'دفع آمن', subtitle_ar = 'الدفع عند الاستلام وطرق دفع آمنة' WHERE id = 3;
UPDATE store_trust_features SET title_ar = 'دعم متخصص', subtitle_ar = 'استشارات فنية من متخصصي الأدوات' WHERE id = 4;

-- Discount cards
UPDATE store_discount_cards SET badge_ar = 'عرض ساخن', title_ar = 'خصم على الأدوات الكهربائية', desc_ar = 'خصم حتى 25% على المثاقب والصاروخ وغيرها', link_label_ar = 'تسوق الآن' WHERE id = 1;
UPDATE store_discount_cards SET badge_ar = 'جديد', title_ar = 'أسعار الجملة', desc_ar = 'أسعار خاصة للمقاولين والطلبات بالجملة', link_label_ar = 'عرض المنتجات' WHERE id = 2;
UPDATE store_discount_cards SET badge_ar = 'محدود', title_ar = 'توصيل مجاني', desc_ar = 'توصيل مجاني للطلبات فوق 2000 جنيه داخل القاهرة', link_label_ar = 'اطلب الآن' WHERE id = 3;

-- Delivery zones
UPDATE delivery_zones SET name_ar = 'القاهرة - وسط البلد' WHERE id = 1;
UPDATE delivery_zones SET name_ar = 'القاهرة - مدينة نصر' WHERE id = 2;
UPDATE delivery_zones SET name_ar = 'الجيزة' WHERE id = 3;
UPDATE delivery_zones SET name_ar = '6 أكتوبر' WHERE id = 4;
UPDATE delivery_zones SET name_ar = 'الإسكندرية' WHERE id = 5;

-- Hero slides
UPDATE store_hero_slides SET tag_ar = 'سيتي تولز', title_ar = 'أدوات كهربائية احترافية', sub_ar = 'أفضل الأسعار في مصر' WHERE id = 1;
UPDATE store_hero_slides SET tag_ar = 'تخفيضات', title_ar = 'خصم حتى 25%', sub_ar = 'على أدوات TOTAL و APT' WHERE id = 2;

SELECT 'statistics' AS section, label_en, label_ar FROM store_statistics
UNION ALL SELECT 'trust', title_en, title_ar FROM store_trust_features
UNION ALL SELECT 'zone', name, name_ar FROM delivery_zones
ORDER BY section;
