"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEffect, useState, useMemo } from "react";
import { Plus, Edit2, Trash2, List, RefreshCw, Search, X, Package, FolderTree } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function AdminItemTypesPage() {
  const locale = useLocale();
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "">("");
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<number | "">("");
  const isRtl = locale === "ar";

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi.getItemTypes(),
      adminApi.getSubcategories(),
      adminApi.getCategories(),
    ])
      .then(([itRes, scRes, catRes]) => {
        setItemTypes(itRes.data || []);
        setSubcategories(scRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Build lookup maps
  const scMap = new Map(subcategories.map(sc => [sc.id, sc]));
  const catMap = new Map(categories.map(c => [c.id, isRtl ? c.nameAr || c.name : c.name]));

  // Subcategories filtered by selected category (for the cascading dropdown)
  const availableSubcategories = useMemo(() => {
    if (filterCategoryId === "") return subcategories;
    return subcategories.filter((sc) => sc.categoryId === filterCategoryId);
  }, [subcategories, filterCategoryId]);

  // Reset subcategory filter when category changes
  useEffect(() => {
    if (filterCategoryId !== "") {
      const scStillValid = availableSubcategories.some((sc) => sc.id === filterSubcategoryId);
      if (!scStillValid) setFilterSubcategoryId("");
    }
  }, [filterCategoryId, availableSubcategories, filterSubcategoryId]);

  const filtered = useMemo(() => {
    let data = itemTypes;

    if (filterSubcategoryId !== "") {
      data = data.filter((it) => it.subcategoryId === filterSubcategoryId);
    } else if (filterCategoryId !== "") {
      data = data.filter((it) => it.subcategory?.categoryId === filterCategoryId);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (it) =>
          it.name?.toLowerCase().includes(q) ||
          it.nameAr?.includes(q) ||
          it.subcategory?.name?.toLowerCase().includes(q) ||
          it.subcategory?.nameAr?.includes(q) ||
          it.subcategory?.category?.name?.toLowerCase().includes(q) ||
          it.subcategory?.category?.nameAr?.includes(q)
      );
    }
    return data;
  }, [itemTypes, filterCategoryId, filterSubcategoryId, search]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(isRtl ? `حذف النوع "${name}"؟` : `Delete item type "${name}"?`)) return;
    setDeletingId(id);
    try {
      await adminApi.deleteItemType(id);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="ait-root">
      <div className="ait-header">
        <div>
          <h1 className="ait-title">{isRtl ? "الأنواع" : "Item Types"}</h1>
          <p className="ait-sub">
            {loading ? "..." : `${filtered.length} / ${itemTypes.length} ${isRtl ? "نوع" : "item types"}`}
          </p>
        </div>
        <div className="ait-header-actions">
          <button onClick={load} className="ait-refresh-btn" title="Refresh">
            <RefreshCw className={`size-4 ${loading ? "ait-spinning" : ""}`} />
          </button>
          <Link href="/admin/item-types/new" className="ait-add-btn">
            <Plus className="size-4" />
            {isRtl ? "إضافة نوع" : "Add Item Type"}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="ait-filters">
        <div className="ait-filter-select-wrap">
          <FolderTree className="ait-filter-icon" />
          <select
            className="ait-filter-select"
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">{isRtl ? "جميع الأقسام" : "All Categories"}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {isRtl ? cat.nameAr || cat.name : cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ait-filter-select-wrap">
          <List className="ait-filter-icon" />
          <select
            className="ait-filter-select"
            value={filterSubcategoryId}
            onChange={(e) => setFilterSubcategoryId(e.target.value ? Number(e.target.value) : "")}
            disabled={filterCategoryId === ""}
          >
            <option value="">{isRtl ? "جميع التصنيفات الفرعية" : "All Subcategories"}</option>
            {availableSubcategories.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {isRtl ? sc.nameAr || sc.name : sc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ait-search-wrap">
          <Search className="ait-search-icon" />
          <input
            className="ait-search-input"
            placeholder={isRtl ? "ابحث باسم النوع..." : "Search item types..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="ait-search-clear" onClick={() => setSearch("")}>
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="ait-table-wrap">
          <div className="ait-skeleton-row" />
          <div className="ait-skeleton-row" />
          <div className="ait-skeleton-row" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="ait-empty">
          <List className="ait-empty-icon" />
          <h3>{isRtl ? "لا توجد أنواع" : "No item types found"}</h3>
          <p>{isRtl ? "حاول تغيير معايير البحث" : "Try changing your search or filter criteria"}</p>
        </div>
      ) : (
        <div className="ait-table-wrap">
          <table className="ait-table">
            <thead>
              <tr>
                <th className="ait-th-id">ID</th>
                <th className="ait-th-name">{isRtl ? "الاسم" : "Name"}</th>
                <th className="ait-th-name-ar">{isRtl ? "الاسم بالعربية" : "Arabic Name"}</th>
                <th className="ait-th-sc">{isRtl ? "التصنيف الفرعي" : "Subcategory"}</th>
                <th className="ait-th-cat">{isRtl ? "القسم الرئيسي" : "Category"}</th>
                <th className="ait-th-prods">{isRtl ? "المنتجات" : "Products"}</th>
                <th className="ait-th-actions">{isRtl ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const sc = it.subcategory;
                const cat = sc?.category;
                const catColor = cat?.color || "#2563eb";
                return (
                  <tr key={it.id}>
                    <td className="ait-td-id">
                      <span className="ait-id-badge">#{it.id}</span>
                    </td>
                    <td className="ait-td-name">{it.name}</td>
                    <td className="ait-td-name-ar">{it.nameAr || "—"}</td>
                    <td className="ait-td-sc">
                      <span className="ait-sc-tag" style={{ background: `${catColor}18`, color: catColor, borderColor: `${catColor}40` }}>
                        {sc ? (isRtl ? sc.nameAr || sc.name : sc.name) : `#${it.subcategoryId}`}
                      </span>
                    </td>
                    <td className="ait-td-cat">
                      <span className="ait-cat-label" style={{ color: catColor }}>
                        {cat ? (isRtl ? cat.nameAr || cat.name : cat.name) : "—"}
                      </span>
                    </td>
                    <td className="ait-td-prods">
                      <span className="ait-count-badge">
                        <Package className="size-3" />
                        {it._count?.products ?? 0}
                      </span>
                    </td>
                    <td className="ait-td-actions">
                      <Link href={`/admin/item-types/${it.id}/edit`} className="ait-action-btn edit">
                        <Edit2 className="size-3.5" />
                        {isRtl ? "تعديل" : "Edit"}
                      </Link>
                      <button
                        className="ait-action-btn delete"
                        disabled={deletingId === it.id}
                        onClick={() => handleDelete(it.id, it.name)}
                      >
                        {deletingId === it.id
                          ? <div className="ait-spinner" />
                          : <Trash2 className="size-3.5" />
                        }
                        {isRtl ? "حذف" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{aitStyles}</style>
    </div>
  );
}

const aitStyles = `
  .ait-root { display: flex; flex-direction: column; gap: 1.25rem; }
  .ait-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .ait-title { font-size: 1.65rem; font-weight: 800; }
  .ait-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
  .ait-header-actions { display: flex; align-items: center; gap: 0.625rem; }
  .ait-refresh-btn { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 0.625rem; border: 1px solid var(--border); background: var(--card); color: var(--muted-foreground); cursor: pointer; transition: all 0.2s; }
  .ait-refresh-btn:hover { background: var(--muted); color: var(--foreground); }
  .ait-spinning { animation: ait-spin 1s linear infinite; }
  @keyframes ait-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .ait-add-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: var(--primary); color: #fff; padding: 0.6rem 1.1rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 14px rgba(192,22,27,0.3); text-decoration: none; }
  .ait-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  /* Filters */
  .ait-filters { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .ait-filter-select-wrap { display: flex; align-items: center; gap: 0.5rem; background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0 0.75rem; min-width: 180px; }
  .ait-filter-icon { width: 16px; height: 16px; color: var(--muted-foreground); flex-shrink: 0; }
  .ait-filter-select { border: none; background: none; padding: 0.6rem 0; font-size: 0.85rem; color: var(--foreground); width: 100%; outline: none; cursor: pointer; }
  .ait-filter-select:disabled { opacity: 0.4; cursor: not-allowed; }
  .ait-filter-select option { color: var(--foreground); background: var(--card); }
  .ait-search-wrap { display: flex; align-items: center; gap: 0.5rem; background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0 0.75rem; flex: 1; min-width: 200px; }
  .ait-search-icon { width: 16px; height: 16px; color: var(--muted-foreground); flex-shrink: 0; }
  .ait-search-input { border: none; background: none; padding: 0.6rem 0; font-size: 0.85rem; color: var(--foreground); width: 100%; outline: none; }
  .ait-search-input::placeholder { color: var(--muted-foreground); opacity: 0.6; }
  .ait-search-clear { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; border: none; background: var(--muted); color: var(--muted-foreground); cursor: pointer; flex-shrink: 0; transition: background 0.2s; }
  .ait-search-clear:hover { background: var(--border); }

  .ait-table-wrap { background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden; }
  .ait-table { width: 100%; border-collapse: collapse; }
  .ait-table th { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted-foreground); text-align: center; padding: 0.875rem 0.75rem; border-bottom: 1px solid var(--border); background: var(--muted); }
  .ait-table td { padding: 0.75rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .ait-table tr:last-child td { border-bottom: none; }
  .ait-table tr:hover td { background: var(--muted); }
  .ait-table tr:nth-child(even) td { background: rgba(0,0,0,0.015); }
  .ait-table tr:nth-child(even):hover td { background: var(--muted); }

  .ait-th-id, .ait-td-id { text-align: center; width: 70px; }
  .ait-th-name, .ait-td-name { text-align: start; min-width: 140px; }
  .ait-th-name-ar, .ait-td-name-ar { text-align: start; min-width: 140px; }
  .ait-th-sc, .ait-td-sc { text-align: center; }
  .ait-th-cat, .ait-td-cat { text-align: center; }
  .ait-th-prods, .ait-td-prods { text-align: center; width: 80px; }
  .ait-th-actions, .ait-td-actions { text-align: center; white-space: nowrap; }

  .ait-id-badge { display: inline-flex; align-items: center; justify-content: center; font-family: monospace; font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); background: var(--muted); border-radius: 999px; padding: 0.15rem 0.55rem; min-width: 36px; }
  .ait-td-name { font-weight: 600; }
  .ait-td-name-ar { color: var(--muted-foreground); }

  .ait-sc-tag { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 600; border-radius: 999px; border: 1px solid; white-space: nowrap; }
  .ait-cat-label { font-size: 0.82rem; font-weight: 600; }
  .ait-count-badge { display: inline-flex; align-items: center; gap: 0.25rem; font-family: monospace; font-size: 0.8rem; font-weight: 700; color: var(--muted-foreground); background: var(--muted); border-radius: 999px; padding: 0.15rem 0.55rem; }

  .ait-td-actions { display: flex; gap: 0.375rem; justify-content: center; }
  .ait-action-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.7rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; border: none; background: none; border-radius: 0.5rem; }
  .ait-action-btn.edit { color: #3b82f6; }
  .ait-action-btn.edit:hover { background: rgba(59,130,246,0.08); }
  .ait-action-btn.delete { color: #ef4444; }
  .ait-action-btn.delete:hover { background: rgba(239,68,68,0.08); }
  .ait-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ait-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(239,68,68,0.3); border-top-color: #ef4444; animation: ait-spin 0.7s linear infinite; display: inline-block; }

  .ait-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; }
  .ait-empty-icon { width: 56px; height: 56px; color: var(--muted-foreground); opacity: 0.3; margin-bottom: 1rem; }
  .ait-empty h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.35rem; }
  .ait-empty p { color: var(--muted-foreground); font-size: 0.875rem; margin-bottom: 0; }

  .ait-skeleton-row { height: 48px; margin: 0 1rem; border-bottom: 1px solid var(--border); background: linear-gradient(90deg, var(--muted) 25%, var(--accent) 50%, var(--muted) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 0.25rem; margin-bottom: 0.5rem; }
  .ait-skeleton-row:first-child { margin-top: 1rem; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;
