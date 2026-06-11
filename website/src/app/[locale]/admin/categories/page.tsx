"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, FolderTree, RefreshCw, Package } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

const ICON_MAP: Record<string, string> = {
  Zap: "⚡", Wrench: "🔧", Bolt: "🔩", Droplets: "💧", Shield: "🛡️",
  Factory: "🏭", Package: "📦", Settings: "⚙️", Tool: "🛠️", Star: "⭐",
};

export default function AdminCategoriesPage() {
  const locale = useLocale();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isRtl = locale === "ar";

  const load = () => {
    setLoading(true);
    adminApi.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(isRtl ? `حذف القسم "${name}"؟` : `Delete category "${name}"?`)) return;
    setDeletingId(id);
    try {
      await adminApi.deleteCategory(id);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="ac-root">
      {/* Header */}
      <div className="ac-header">
        <div>
          <h1 className="ac-title">{isRtl ? "الأقسام" : "Categories"}</h1>
          <p className="ac-sub">
            {loading ? "..." : `${categories.length} ${isRtl ? "قسم في قاعدة البيانات" : "categories in the database"}`}
          </p>
        </div>
        <div className="ac-header-actions">
          <button onClick={load} className="ac-refresh-btn" title="Refresh">
            <RefreshCw className={`size-4 ${loading ? "ac-spinning" : ""}`} />
          </button>
          <Link href="/admin/categories/new" className="ac-add-btn">
            <Plus className="size-4" />
            {isRtl ? "إضافة قسم" : "Add Category"}
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="ac-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ac-skeleton-card">
              <div className="ac-skeleton ac-sk-icon" />
              <div style={{ flex: 1 }}>
                <div className="ac-skeleton ac-sk-title" />
                <div className="ac-skeleton ac-sk-sub" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="ac-empty">
          <FolderTree className="ac-empty-icon" />
          <h3>{isRtl ? "لا توجد أقسام" : "No categories yet"}</h3>
          <p>{isRtl ? "أضف أول قسم الآن" : "Add your first category now"}</p>
          <Link href="/admin/categories/new" className="ac-empty-btn">
            <Plus className="size-4" />
            {isRtl ? "إضافة قسم" : "Add Category"}
          </Link>
        </div>
      ) : (
        <div className="ac-grid">
          {categories.map((c) => (
            <div key={c.id} className="ac-card">
              {/* Color stripe */}
              <div className="ac-card-stripe" style={{ background: c.color }} />

              <div className="ac-card-body">
                {/* Icon circle */}
                <div className="ac-icon-wrap" style={{ background: `${c.color}22` }}>
                  <span className="ac-icon-emoji">{ICON_MAP[c.icon] || "📦"}</span>
                </div>

                <div className="ac-card-info">
                  <p className="ac-name-en">{c.name}</p>
                  <p className="ac-name-ar">{c.nameAr}</p>
                  <div className="ac-meta-row">
                    <span className="ac-slug">/{c.slug}</span>
                    <span className="ac-dot">·</span>
                    <span className="ac-prod-count">
                      <Package className="size-3" />
                      {c.productCount || 0} {isRtl ? "منتج" : "products"}
                    </span>
                  </div>
                </div>

                {/* Color swatch */}
                <div className="ac-color-swatch" style={{ background: c.color }} title={c.color} />
              </div>

              {/* Actions */}
              <div className="ac-card-actions">
                <Link href={`/admin/categories/${c.id}/edit`} className="ac-action-btn edit">
                  <Edit2 className="size-3.5" />
                  {isRtl ? "تعديل" : "Edit"}
                </Link>
                <button
                  className="ac-action-btn delete"
                  disabled={deletingId === c.id}
                  onClick={() => handleDelete(c.id, c.name)}
                >
                  {deletingId === c.id
                    ? <div className="ac-spinner" />
                    : <Trash2 className="size-3.5" />
                  }
                  {isRtl ? "حذف" : "Delete"}
                </button>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <Link href="/admin/categories/new" className="ac-new-card">
            <Plus className="ac-new-icon" />
            <p className="ac-new-label">{isRtl ? "إضافة قسم جديد" : "Add New Category"}</p>
          </Link>
        </div>
      )}

      <style>{`
        .ac-root { display: flex; flex-direction: column; gap: 1.5rem; }

        .ac-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .ac-title { font-size: 1.65rem; font-weight: 800; }
        .ac-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
        .ac-header-actions { display: flex; align-items: center; gap: 0.625rem; }
        .ac-refresh-btn {
          width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
          border-radius: 0.625rem; border: 1px solid var(--border);
          background: var(--card); color: var(--muted-foreground);
          cursor: pointer; transition: all 0.2s;
        }
        .ac-refresh-btn:hover { background: var(--muted); color: var(--foreground); }
        .ac-spinning { animation: ac-spin 1s linear infinite; }
        @keyframes ac-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ac-add-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--primary); color: #fff;
          padding: 0.6rem 1.1rem; border-radius: 999px;
          font-weight: 700; font-size: 0.875rem;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 14px rgba(192,22,27,0.3);
          text-decoration: none;
        }
        .ac-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* Grid */
        .ac-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        /* Card */
        .ac-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1.25rem; overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          display: flex; flex-direction: column;
        }
        .ac-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.09); }

        .ac-card-stripe { height: 4px; width: 100%; }
        .ac-card-body {
          display: flex; align-items: center; gap: 0.875rem;
          padding: 1.125rem 1.125rem 0.75rem;
          flex: 1;
        }
        .ac-icon-wrap {
          width: 48px; height: 48px; border-radius: 0.875rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ac-icon-emoji { font-size: 1.4rem; }
        .ac-card-info { flex: 1; min-width: 0; }
        .ac-name-en { font-weight: 700; font-size: 0.95rem; color: var(--foreground); }
        .ac-name-ar { font-size: 0.85rem; color: var(--muted-foreground); margin-top: 0.1rem; }
        .ac-meta-row {
          display: flex; align-items: center; gap: 0.375rem;
          margin-top: 0.4rem;
        }
        .ac-slug { font-size: 0.7rem; color: var(--muted-foreground); font-family: monospace; }
        .ac-dot { color: var(--muted-foreground); font-size: 0.7rem; }
        .ac-prod-count {
          display: flex; align-items: center; gap: 0.2rem;
          font-size: 0.7rem; color: var(--muted-foreground);
        }
        .ac-color-swatch {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.6);
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          flex-shrink: 0;
        }

        .ac-card-actions {
          display: flex; border-top: 1px solid var(--border);
        }
        .ac-action-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.35rem;
          padding: 0.6rem 0.5rem;
          font-size: 0.78rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          text-decoration: none; border: none; background: none;
        }
        .ac-action-btn + .ac-action-btn { border-inline-start: 1px solid var(--border); }
        .ac-action-btn.edit { color: #3b82f6; }
        .ac-action-btn.edit:hover { background: rgba(59,130,246,0.08); }
        .ac-action-btn.delete { color: #ef4444; }
        .ac-action-btn.delete:hover { background: rgba(239,68,68,0.08); }
        .ac-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ac-spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(239,68,68,0.3);
          border-top-color: #ef4444;
          animation: ac-spin 0.7s linear infinite;
        }

        /* New Card */
        .ac-new-card {
          background: var(--muted); border: 2px dashed var(--border);
          border-radius: 1.25rem; min-height: 140px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 0.5rem; text-decoration: none;
          transition: all 0.2s;
        }
        .ac-new-card:hover { border-color: var(--primary); background: rgba(192,22,27,0.05); }
        .ac-new-icon { width: 28px; height: 28px; color: var(--muted-foreground); }
        .ac-new-label { font-size: 0.85rem; font-weight: 600; color: var(--muted-foreground); }
        .ac-new-card:hover .ac-new-icon,
        .ac-new-card:hover .ac-new-label { color: var(--primary); }

        /* Skeleton */
        .ac-skeleton-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1.25rem; padding: 1.125rem;
          display: flex; align-items: center; gap: 0.875rem;
        }
        .ac-skeleton {
          background: linear-gradient(90deg, var(--muted) 25%, var(--accent) 50%, var(--muted) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 0.5rem;
        }
        .ac-sk-icon { width: 48px; height: 48px; border-radius: 0.875rem; flex-shrink: 0; }
        .ac-sk-title { height: 14px; width: 120px; margin-bottom: 0.5rem; }
        .ac-sk-sub { height: 11px; width: 80px; }

        /* Empty */
        .ac-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 4rem 2rem; text-align: center;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1.25rem;
        }
        .ac-empty-icon { width: 56px; height: 56px; color: var(--muted-foreground); opacity: 0.3; margin-bottom: 1rem; }
        .ac-empty h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.35rem; }
        .ac-empty p { color: var(--muted-foreground); font-size: 0.875rem; margin-bottom: 1.5rem; }
        .ac-empty-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--primary); color: #fff;
          padding: 0.6rem 1.25rem; border-radius: 999px;
          font-weight: 700; font-size: 0.875rem;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
