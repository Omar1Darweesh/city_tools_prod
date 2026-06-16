-- Fix Arabic text for delivery_zones (run on test DB only)
-- sudo -u postgres psql -d citytools_city_tools -f fix-arabic-delivery-zones.sql

UPDATE delivery_zones SET name_ar = 'القاهرة - وسط البلد' WHERE id = 1;
UPDATE delivery_zones SET name_ar = 'القاهرة - مدينة نصر' WHERE id = 2;
UPDATE delivery_zones SET name_ar = 'الجيزة' WHERE id = 3;
UPDATE delivery_zones SET name_ar = '6 أكتوبر' WHERE id = 4;
UPDATE delivery_zones SET name_ar = 'الإسكندرية' WHERE id = 5;

SELECT id, name, name_ar FROM delivery_zones ORDER BY sort_order;
