-- Ensure المصروفات (expenses) page exists and is visible to ADMIN in the backoffice sidebar.
-- Run: psql -U citytools_app -d citytools_city_tools -f scripts/ensure-expenses-page.sql

INSERT INTO pages (key, name_en, name_ar, category, icon, route, sort_order, active, created_at)
VALUES ('expenses', 'Expenses', 'المصروفات', 'transactions', 'Wallet', '/expenses', 5, true, NOW())
ON CONFLICT (key) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  route = EXCLUDED.route,
  sort_order = EXCLUDED.sort_order,
  active = true;

INSERT INTO role_pages (role_id, page_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN pages p
WHERE r.name = 'ADMIN' AND p.key = 'expenses'
ON CONFLICT DO NOTHING;
