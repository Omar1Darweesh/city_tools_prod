"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { Plus, Award, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function AdminBrandsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () =>
    adminApi.getBrands().then((res) => setBrands(res.data || [])).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(isRtl ? "هل أنت متأكد من حذف هذه الماركة؟" : "Are you sure you want to delete this brand?")) return;
    setDeleting(id);
    try {
      await adminApi.deleteBrand(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.nameAr.includes(search)
  );

  return (
    <div className="br-root">
      <div className="br-header">
        <div>
          <h1 className="br-title">{isRtl ? "الماركات" : "Brands"}</h1>
          <p className="br-sub">{isRtl ? "إدارة الماركات المعتمدة" : "Manage trusted brands"}</p>
        </div>
        <Link href="/admin/brands/new" className="br-add-btn">
          <Plus className="size-4" />
          {isRtl ? "إضافة ماركة" : "Add Brand"}
        </Link>
      </div>

      <div className="br-search-wrap">
        <Search className="br-search-icon" />
        <input
          className="br-search-input"
          placeholder={isRtl ? "ابحث عن ماركة..." : "Search brands..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="br-loading"><Loader2 className="size-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="br-empty">
          <Award className="size-12 text-muted-foreground/30" />
          <p>{isRtl ? "لا توجد ماركات" : "No brands found"}</p>
        </div>
      ) : (
        <div className="br-grid">
          {filtered.map((brand) => (
            <div key={brand.id} className="br-card">
              <div className="br-card-top">
                <div className="br-avatar">
                  <Award className="size-5 text-white" />
                </div>
                <div className="br-info">
                  <p className="br-name">{isRtl ? brand.nameAr : brand.name}</p>
                  <p className="br-meta">{brand.name}{brand.nameAr ? ` · ${brand.nameAr}` : ""}</p>
                </div>
                <div className={`br-trusted ${brand.isTrusted ? "yes" : "no"}`}>
                  {brand.isTrusted ? (isRtl ? "معتمدة" : "Trusted") : (isRtl ? "غير معتمدة" : "Untrusted")}
                </div>
              </div>
              <div className="br-card-stats">
                <span>{brand.productCount} {isRtl ? "منتج" : "products"}</span>
                <span>{isRtl ? "ترتيب" : "Sort"}: {brand.sortOrder}</span>
              </div>
              <div className="br-actions">
                <Link href={`/admin/brands/${brand.id}/edit`} className="br-action-btn edit">
                  <Pencil className="size-3.5" />
                  {isRtl ? "تعديل" : "Edit"}
                </Link>
                <button onClick={() => handleDelete(brand.id)} disabled={deleting === brand.id} className="br-action-btn danger">
                  {deleting === brand.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  {isRtl ? "حذف" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .br-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .br-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .br-title { font-size: 1.65rem; font-weight: 800; }
        .br-sub { font-size: 0.85rem; color: var(--muted-foreground); margin-top: 0.2rem; }
        .br-add-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--primary); color: #fff; padding: 0.6rem 1.25rem;
          border-radius: 999px; font-weight: 700; font-size: 0.875rem;
          text-decoration: none; transition: opacity 0.2s;
          box-shadow: 0 4px 16px rgba(192,22,27,0.3);
        }
        .br-add-btn:hover { opacity: 0.9; }

        .br-search-wrap { position: relative; max-width: 360px; }
        .br-search-icon { position: absolute; start: 12px; top: 50%; transform: translateY(-50%); size: 16px; color: var(--muted-foreground); width: 16px; height: 16px; }
        .br-search-input {
          width: 100%; padding: 0.6rem 0.875rem 0.6rem 2.5rem;
          border: 1.5px solid var(--border); border-radius: 0.75rem;
          background: var(--background); font-size: 0.875rem; color: var(--foreground);
          outline: none; transition: border-color 0.2s;
        }
        .br-search-input:focus { border-color: var(--primary); }

        .br-loading { display: flex; justify-content: center; padding: 4rem 0; color: var(--muted-foreground); }
        .br-empty {
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
          padding: 4rem 0; color: var(--muted-foreground); font-size: 0.9rem;
        }

        .br-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .br-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1.25rem; padding: 1.25rem;
          display: flex; flex-direction: column; gap: 0.75rem;
          transition: box-shadow 0.2s;
        }
        .br-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); }

        .br-card-top { display: flex; align-items: center; gap: 0.75rem; }
        .br-avatar {
          width: 44px; height: 44px; border-radius: 0.875rem;
          background: linear-gradient(135deg, #C0161B, #e83030);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .br-info { flex: 1; min-width: 0; }
        .br-name { font-weight: 700; font-size: 0.95rem; }
        .br-meta { font-size: 0.75rem; color: var(--muted-foreground); margin-top: 0.1rem; }

        .br-trusted {
          font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.5rem;
          border-radius: 999px; white-space: nowrap;
        }
        .br-trusted.yes { background: rgba(16,185,129,0.12); color: #065f46; }
        .br-trusted.no { background: rgba(220,38,38,0.08); color: #b91c1c; }

        .br-card-stats {
          display: flex; gap: 1rem; font-size: 0.75rem; color: var(--muted-foreground);
          padding: 0.5rem 0; border-top: 1px solid var(--border);
        }

        .br-actions { display: flex; gap: 0.5rem; }
        .br-action-btn {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.4rem 0.75rem; border-radius: 0.625rem;
          font-size: 0.78rem; font-weight: 600; border: none; cursor: pointer;
          text-decoration: none; transition: background 0.2s;
        }
        .br-action-btn.edit { background: var(--muted); color: var(--foreground); }
        .br-action-btn.edit:hover { background: var(--border); }
        .br-action-btn.danger { background: rgba(220,38,38,0.08); color: #b91c1c; }
        .br-action-btn.danger:hover { background: rgba(220,38,38,0.15); }
        .br-action-btn:disabled { opacity: 0.6; }
      `}</style>
    </div>
  );
}
