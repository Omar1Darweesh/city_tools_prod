"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEffect, useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Layers, RefreshCw, Search, X, FolderTree } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function AdminSubcategoriesPage() {
  const locale = useLocale();
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "">("");
  const isRtl = locale === "ar";

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi.getSubcategories(),
      adminApi.getCategories(),
    ])
      .then(([scRes, catRes]) => {
        setSubcategories(scRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const catMap = new Map(categories.map(c => [c.id, isRtl ? c.nameAr : c.name]));

  const filtered = useMemo(() => {
    let data = subcategories;
    if (filterCategoryId !== "") {
      data = data.filter((sc) => sc.categoryId === filterCategoryId);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (sc) =>
          sc.name?.toLowerCase().includes(q) ||
          sc.nameAr?.includes(q) ||
          sc.category?.name?.toLowerCase().includes(q) ||
          sc.category?.nameAr?.includes(q)
      );
    }
    return data;
  }, [subcategories, filterCategoryId, search]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(isRtl ? `حذف التصنيف الفرعي "${name}"؟` : `Delete subcategory "${name}"?`)) return;
    setDeletingId(id);
    try {
      await adminApi.deleteSubcategory(id);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="asc-root">
      <div className="asc-header">
        <div>
          <h1 className="asc-title">{isRtl ? "التصنيفات الفرعية" : "Subcategories"}</h1>
          <p className="asc-sub">
            {loading ? "..." : `${filtered.length} / ${subcategories.length} ${isRtl ? "تصنيف فرعي" : "subcategories"}`}
          </p>
        </div>
        <div className="asc-header-actions">
          <button onClick={load} className="asc-refresh-btn" title="Refresh">
            <RefreshCw className={`size-4 ${loading ? "asc-spinning" : ""}`} />
          </button>
          <Link href="/admin/subcategories/new" className="asc-add-btn">
            <Plus className="size-4" />
            {isRtl ? "إضافة تصنيف فرعي" : "Add Subcategory"}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="asc-filters">
        <div className="asc-filter-select-wrap">
          <FolderTree className="asc-filter-icon" />
          <select
            className="asc-filter-select"
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

        <div className="asc-search-wrap">
          <Search className="asc-search-icon" />
          <input
            className="asc-search-input"
            placeholder={isRtl ? "ابحث باسم التصنيف..." : "Search subcategories..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="asc-search-clear" onClick={() => setSearch("")}>
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="asc-table-wrap">
          <div className="asc-skeleton-row" />
          <div className="asc-skeleton-row" />
          <div className="asc-skeleton-row" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="asc-empty">
          <Layers className="asc-empty-icon" />
          <h3>{isRtl ? "لا توجد تصنيفات فرعية" : "No subcategories found"}</h3>
          <p>{isRtl ? "حاول تغيير معايير البحث" : "Try changing your search or filter criteria"}</p>
        </div>
      ) : (
        <div className="asc-table-wrap">
          <table className="asc-table">
            <thead>
              <tr>
                <th className="asc-th-id">ID</th>
                <th className="asc-th-name">{isRtl ? "الاسم" : "Name"}</th>
                <th className="asc-th-name-ar">{isRtl ? "الاسم بالعربية" : "Arabic Name"}</th>
                <th className="asc-th-cat">{isRtl ? "القسم الرئيسي" : "Category"}</th>
                <th className="asc-th-types">Item Types</th>
                <th className="asc-th-actions">{isRtl ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sc) => {
                const catColor = sc.category?.color || "#2563eb";
                return (
                  <tr key={sc.id}>
                    <td className="asc-td-id">
                      <span className="asc-id-badge">#{sc.id}</span>
                    </td>
                    <td className="asc-td-name">{sc.name}</td>
                    <td className="asc-td-name-ar">{sc.nameAr || "—"}</td>
                    <td className="asc-td-cat">
                      <span className="asc-cat-tag" style={{ background: `${catColor}18`, color: catColor, borderColor: `${catColor}40` }}>
                        {catMap.get(sc.categoryId) || `#${sc.categoryId}`}
                      </span>
                    </td>
                    <td className="asc-td-types">
                      <span className="asc-count-badge">{sc._count?.itemTypes ?? "—"}</span>
                    </td>
                    <td className="asc-td-actions">
                      <Link href={`/admin/subcategories/${sc.id}/edit`} className="asc-action-btn edit">
                        <Edit2 className="size-3.5" />
                        {isRtl ? "تعديل" : "Edit"}
                      </Link>
                      <button
                        className="asc-action-btn delete"
                        disabled={deletingId === sc.id}
                        onClick={() => handleDelete(sc.id, sc.name)}
                      >
                        {deletingId === sc.id
                          ? <div className="asc-spinner" />
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

      <style>{ascStyles}</style>
    </div>
  );
}

const ascStyles = `
  .asc-root { display: flex; flex-direction: column; gap: 1.25rem; }
  .asc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .asc-title { font-size: 1.65rem; font-weight: 800; }
  .asc-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
  .asc-header-actions { display: flex; align-items: center; gap: 0.625rem; }
  .asc-refresh-btn { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 0.625rem; border: 1px solid var(--border); background: var(--card); color: var(--muted-foreground); cursor: pointer; transition: all 0.2s; }
  .asc-refresh-btn:hover { background: var(--muted); color: var(--foreground); }
  .asc-spinning { animation: asc-spin 1s linear infinite; }
  @keyframes asc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .asc-add-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: var(--primary); color: #fff; padding: 0.6rem 1.1rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 14px rgba(192,22,27,0.3); text-decoration: none; }
  .asc-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  /* Filters */
  .asc-filters { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .asc-filter-select-wrap { display: flex; align-items: center; gap: 0.5rem; background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0 0.75rem; min-width: 180px; }
  .asc-filter-icon { width: 16px; height: 16px; color: var(--muted-foreground); flex-shrink: 0; }
  .asc-filter-select { border: none; background: none; padding: 0.6rem 0; font-size: 0.85rem; color: var(--foreground); width: 100%; outline: none; cursor: pointer; }
  .asc-filter-select option { color: var(--foreground); background: var(--card); }
  .asc-search-wrap { display: flex; align-items: center; gap: 0.5rem; background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0 0.75rem; flex: 1; min-width: 200px; }
  .asc-search-icon { width: 16px; height: 16px; color: var(--muted-foreground); flex-shrink: 0; }
  .asc-search-input { border: none; background: none; padding: 0.6rem 0; font-size: 0.85rem; color: var(--foreground); width: 100%; outline: none; }
  .asc-search-input::placeholder { color: var(--muted-foreground); opacity: 0.6; }
  .asc-search-clear { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; border: none; background: var(--muted); color: var(--muted-foreground); cursor: pointer; flex-shrink: 0; transition: background 0.2s; }
  .asc-search-clear:hover { background: var(--border); }

  .asc-table-wrap { background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden; }
  .asc-table { width: 100%; border-collapse: collapse; }
  .asc-table th { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted-foreground); text-align: center; padding: 0.875rem 0.75rem; border-bottom: 1px solid var(--border); background: var(--muted); }
  .asc-table td { padding: 0.75rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .asc-table tr:last-child td { border-bottom: none; }
  .asc-table tr:hover td { background: var(--muted); }
  .asc-table tr:nth-child(even) td { background: rgba(0,0,0,0.015); }
  .asc-table tr:nth-child(even):hover td { background: var(--muted); }

  .asc-th-id, .asc-td-id { text-align: center; width: 70px; }
  .asc-th-name, .asc-td-name { text-align: start; min-width: 140px; }
  .asc-th-name-ar, .asc-td-name-ar { text-align: start; min-width: 140px; }
  .asc-th-cat, .asc-td-cat { text-align: center; }
  .asc-th-types, .asc-td-types { text-align: center; width: 100px; }
  .asc-th-actions, .asc-td-actions { text-align: center; white-space: nowrap; }

  .asc-id-badge { display: inline-flex; align-items: center; justify-content: center; font-family: monospace; font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); background: var(--muted); border-radius: 999px; padding: 0.15rem 0.55rem; min-width: 36px; }
  .asc-td-name { font-weight: 600; }
  .asc-td-name-ar { color: var(--muted-foreground); }

  .asc-cat-tag { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 600; border-radius: 999px; border: 1px solid; white-space: nowrap; }
  .asc-count-badge { display: inline-flex; align-items: center; justify-content: center; font-family: monospace; font-size: 0.8rem; font-weight: 700; color: var(--muted-foreground); background: var(--muted); border-radius: 999px; padding: 0.15rem 0.55rem; min-width: 28px; }

  .asc-td-actions { display: flex; gap: 0.375rem; justify-content: center; }
  .asc-action-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.7rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; border: none; background: none; border-radius: 0.5rem; }
  .asc-action-btn.edit { color: #3b82f6; }
  .asc-action-btn.edit:hover { background: rgba(59,130,246,0.08); }
  .asc-action-btn.delete { color: #ef4444; }
  .asc-action-btn.delete:hover { background: rgba(239,68,68,0.08); }
  .asc-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .asc-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(239,68,68,0.3); border-top-color: #ef4444; animation: asc-spin 0.7s linear infinite; display: inline-block; }

  .asc-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; }
  .asc-empty-icon { width: 56px; height: 56px; color: var(--muted-foreground); opacity: 0.3; margin-bottom: 1rem; }
  .asc-empty h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.35rem; }
  .asc-empty p { color: var(--muted-foreground); font-size: 0.875rem; margin-bottom: 0; }

  .asc-skeleton-row { height: 48px; margin: 0 1rem; border-bottom: 1px solid var(--border); background: linear-gradient(90deg, var(--muted) 25%, var(--accent) 50%, var(--muted) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 0.25rem; margin-bottom: 0.5rem; }
  .asc-skeleton-row:first-child { margin-top: 1rem; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;
