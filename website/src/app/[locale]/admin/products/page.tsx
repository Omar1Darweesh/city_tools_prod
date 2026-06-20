"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Edit2, Trash2, Search, Package, CheckCircle, XCircle, Tag, RefreshCw, Star, Flame, Boxes, AlertTriangle } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function AdminProductsPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const zeroPriceOnly = searchParams.get("zeroPrice") === "1";
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const isRtl = locale === "ar";

  const loadProducts = (q = "") => {
    setLoading(true);
    const params = q ? `search=${encodeURIComponent(q)}&limit=100` : "limit=100";
    adminApi.getProducts(params)
      .then((res) => { setProducts(res.data || []); setTotal(res.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(isRtl ? `حذف "${name}"؟` : `Delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      await adminApi.deleteProduct(id);
      loadProducts(search);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: number, field: string, value: boolean) => {
    setTogglingId(id);
    try {
      await adminApi.updateProduct(id, { [field]: value });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    } catch {
      // revert on failure
    } finally {
      setTogglingId(null);
    }
  };

  const isZeroPrice = (p: any) => {
    const retail = Number(p.priceRetail ?? 0);
    const discount = p.discountPrice != null ? Number(p.discountPrice) : null;
    const effective = discount != null && discount > 0 ? discount : retail;
    return !Number.isFinite(effective) || effective <= 0;
  };

  const filtered = (zeroPriceOnly ? products.filter(isZeroPrice) : products).filter((p) =>
    !search ||
    p.nameEn?.toLowerCase().includes(search.toLowerCase()) ||
    p.nameAr?.includes(search) ||
    p.code?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ap-root">
      {/* Header */}
      <div className="ap-header">
        <div>
          <h1 className="ap-title">{isRtl ? "المنتجات" : "Products"}</h1>
          <p className="ap-sub">
            {loading ? "..." : `${total} ${isRtl ? "منتج في قاعدة البيانات" : "products in the database"}`}
          </p>
        </div>
        <div className="ap-header-actions">
          <button onClick={() => loadProducts(search)} className="ap-refresh-btn" title="Refresh">
            <RefreshCw className={`size-4 ${loading ? "ap-spinning" : ""}`} />
          </button>
          <Link href="/admin/products/new" className="ap-add-btn">
            <Plus className="size-4" />
            {isRtl ? "إضافة منتج" : "Add Product"}
          </Link>
        </div>
      </div>

      {zeroPriceOnly && (
        <div className="ap-zero-price-banner">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {isRtl
              ? "عرض المنتجات بسعر صفر فقط — مخفية من المتجر العام"
              : "Showing zero-price products only — hidden from the public store"}
          </span>
          <Link href="/admin/products" className="ap-zero-price-clear">
            {isRtl ? "عرض الكل" : "Show all"}
          </Link>
        </div>
      )}

      {/* Search Bar */}
      <div className="ap-search-wrap">
        <Search className="ap-search-icon" />
        <input
          className="ap-search-input"
          placeholder={isRtl ? "ابحث بالاسم أو الكود أو العلامة التجارية..." : "Search by name, code or brand..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="ap-search-clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {/* Table / States */}
      {loading ? (
        <div className="ap-skeleton-table">
          <div className="ap-skeleton-head" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ap-skeleton-row">
              <div className="ap-skeleton ap-sk-sm" />
              <div className="ap-skeleton ap-sk-md" />
              <div className="ap-skeleton ap-sk-lg" />
              <div className="ap-skeleton ap-sk-sm" />
              <div className="ap-skeleton ap-sk-sm" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ap-empty">
          <Package className="ap-empty-icon" />
          <h3>{isRtl ? "لا توجد منتجات" : "No products found"}</h3>
          <p>{search ? (isRtl ? "لم يطابق بحثك أي نتائج" : "No results match your search") : (isRtl ? "أضف أول منتج الآن" : "Add your first product now")}</p>
          {!search && (
            <Link href="/admin/products/new" className="ap-empty-btn">
              <Plus className="size-4" />
              {isRtl ? "إضافة منتج" : "Add Product"}
            </Link>
          )}
        </div>
      ) : (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>{isRtl ? "الكود" : "Code"}</th>
                <th>{isRtl ? "الاسم (إنجليزي)" : "Name (EN)"}</th>
                <th>{isRtl ? "الاسم (عربي)" : "Name (AR)"}</th>
                <th>{isRtl ? "سعر التجزئة" : "Retail Price"}</th>
                <th>{isRtl ? "القسم" : "Category"}</th>
                <th>{isRtl ? "العلامة التجارية" : "Brand"}</th>
                <th>{isRtl ? "المخزون" : "Stock"}</th>
                <th>{isRtl ? "الحالة" : "Status"}</th>
                <th>{isRtl ? "الوسم" : "Badge"}</th>
                <th>{isRtl ? "شائع" : "Popular"}</th>
                <th>{isRtl ? "الأكثر مبيعاً" : "Best Seller"}</th>
                <th className="ap-th-end">{isRtl ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className={`ap-tr${isZeroPrice(p) ? " ap-tr-zero-price" : ""}`}>
                  <td><span className="ap-code">{p.code}</span></td>
                  <td><span className="ap-name-en">{p.nameEn}</span></td>
                  <td><span className="ap-name-ar">{p.nameAr}</span></td>
                  <td>
                    <div className="ap-price-cell">
                      <span className={`ap-price${isZeroPrice(p) ? " ap-price-zero" : ""}`}>
                        {Number(p.priceRetail).toLocaleString()} EGP
                      </span>
                      {p.discountPrice && (
                        <span className="ap-discount">{Number(p.discountPrice).toLocaleString()}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="ap-category">
                      {isRtl ? p.category?.nameAr || "—" : p.category?.name || "—"}
                    </span>
                  </td>
                  <td><span className="ap-brand">{p.brand}</span></td>
                  <td>
                    <span className={`ap-qty-pill ${(p.stock ?? 0) === 0 ? "qty-out" : (p.stock ?? 0) < 10 ? "qty-low" : "qty-ok"}`}>
                      <Boxes className="size-3" />
                      {p.stock ?? 0}
                    </span>
                  </td>
                  <td>
                    <div className={`ap-stock ${p.inStock ? "in-stock" : "out-stock"}`}>
                      {p.inStock
                        ? <><CheckCircle className="size-3" />{isRtl ? "متوفر" : "In Stock"}</>
                        : <><XCircle className="size-3" />{isRtl ? "نفد" : "Out"}</>
                      }
                    </div>
                  </td>
                  <td>
                    {p.badge ? (
                      <span className={`ap-badge ${p.badge === "SALE" ? "badge-sale" : "badge-new"}`}>
                        <Tag className="size-2.5" />
                        {p.badge}
                      </span>
                    ) : <span className="ap-no-badge">—</span>}
                  </td>
                  <td>
                    <button
                      className={`ap-flag-toggle ${p.isPopular ? "on popular" : "off"}`}
                      disabled={togglingId === p.id}
                      onClick={() => handleToggle(p.id, "isPopular", !p.isPopular)}
                      title={isRtl ? "تبديل الشائع" : "Toggle popular"}
                    >
                      <Star className="size-3.5" />
                    </button>
                  </td>
                  <td>
                    <button
                      className={`ap-flag-toggle ${p.isBestSale ? "on best" : "off"}`}
                      disabled={togglingId === p.id}
                      onClick={() => handleToggle(p.id, "isBestSale", !p.isBestSale)}
                      title={isRtl ? "تبديل الأكثر مبيعاً" : "Toggle best seller"}
                    >
                      <Flame className="size-3.5" />
                    </button>
                  </td>
                  <td className="ap-td-end">
                    <div className="ap-actions">
                      <Link href={`/admin/products/${p.id}/edit`} className="ap-action-btn edit">
                        <Edit2 className="size-3.5" />
                      </Link>
                      <button
                        className="ap-action-btn delete"
                        disabled={deletingId === p.id}
                        onClick={() => handleDelete(p.id, p.nameEn)}
                      >
                        {deletingId === p.id
                          ? <div className="ap-spinner" />
                          : <Trash2 className="size-3.5" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .ap-root { display: flex; flex-direction: column; gap: 1.5rem; }

        .ap-zero-price-banner {
          display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(245,158,11,0.35);
          background: rgba(245,158,11,0.1);
          color: #92400e;
          font-size: 0.85rem;
        }
        .ap-zero-price-clear {
          margin-inline-start: auto;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
        }
        .ap-tr-zero-price { background: rgba(245,158,11,0.06); }
        .ap-price-zero { color: #b45309; font-weight: 700; }

        /* Header */
        .ap-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .ap-title { font-size: 1.65rem; font-weight: 800; }
        .ap-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
        .ap-header-actions { display: flex; align-items: center; gap: 0.625rem; }
        .ap-refresh-btn {
          width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 0.625rem; border: 1px solid var(--border);
          background: var(--card); color: var(--muted-foreground);
          cursor: pointer; transition: all 0.2s;
        }
        .ap-refresh-btn:hover { background: var(--muted); color: var(--foreground); }
        .ap-spinning { animation: ap-spin 1s linear infinite; }
        @keyframes ap-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ap-add-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--primary); color: #fff;
          padding: 0.6rem 1.1rem; border-radius: 999px;
          font-weight: 700; font-size: 0.875rem;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 14px rgba(192,22,27,0.3);
          text-decoration: none;
        }
        .ap-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* Search */
        .ap-search-wrap {
          display: flex; align-items: center; gap: 0;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 0.875rem; overflow: hidden;
          transition: box-shadow 0.2s, border-color 0.2s;
          max-width: 480px;
        }
        .ap-search-wrap:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(192,22,27,0.12);
        }
        .ap-search-icon {
          width: 36px; flex-shrink: 0;
          color: var(--muted-foreground);
          margin-inline-start: 0.75rem;
          size: 1rem; width: 16px; height: 16px;
        }
        .ap-search-input {
          flex: 1; border: none; outline: none;
          background: transparent; padding: 0.65rem 0.75rem;
          font-size: 0.875rem; color: var(--foreground);
          font-family: inherit;
        }
        .ap-search-input::placeholder { color: var(--muted-foreground); }
        .ap-search-clear {
          padding: 0.5rem 0.75rem; background: none; border: none;
          cursor: pointer; color: var(--muted-foreground); font-size: 0.8rem;
          transition: color 0.2s;
        }
        .ap-search-clear:hover { color: var(--foreground); }

        /* Table */
        .ap-table-wrap {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1.25rem; overflow-x: auto; overflow-y: visible;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .ap-table { width: max-content; min-width: 100%; border-collapse: collapse; font-size: 0.83rem; }
        .ap-table thead { background: var(--muted); }
        .ap-table th {
          text-align: start; padding: 0.75rem 1rem;
          font-weight: 700; color: var(--muted-foreground);
          font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase;
          white-space: nowrap;
        }
        .ap-th-end { text-align: end; }
        .ap-tr { border-top: 1px solid var(--border); transition: background 0.15s; }
        .ap-tr:hover { background: var(--muted)/50; }
        .ap-table td { padding: 0.75rem 1rem; vertical-align: middle; }
        .ap-td-end { text-align: end; }

        .ap-code {
          font-family: monospace; font-size: 0.75rem;
          background: var(--muted); color: var(--foreground);
          padding: 0.2rem 0.5rem; border-radius: 0.375rem;
          font-weight: 600; white-space: nowrap;
        }
        .ap-name-en { font-weight: 600; color: var(--foreground); }
        .ap-name-ar { color: var(--muted-foreground); }
        .ap-price-cell { display: flex; flex-direction: column; gap: 0.1rem; }
        .ap-price { font-weight: 700; color: var(--foreground); white-space: nowrap; }
        .ap-discount { font-size: 0.72rem; color: #ef4444; text-decoration: line-through; }
        .ap-category {
          background: var(--accent); color: var(--foreground);
          padding: 0.2rem 0.5rem; border-radius: 0.375rem;
          font-size: 0.72rem; font-weight: 600; white-space: nowrap;
        }
        .ap-brand { color: var(--muted-foreground); font-size: 0.78rem; }
        .ap-stock {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.72rem; font-weight: 700;
          padding: 0.2rem 0.6rem; border-radius: 999px;
        }
        .ap-stock.in-stock { background: rgba(16,185,129,0.12); color: #065f46; }
        .ap-stock.out-stock { background: rgba(220,38,38,0.1); color: #b91c1c; }
        .ap-qty-pill {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.72rem; font-weight: 700;
          padding: 0.2rem 0.55rem; border-radius: 999px;
          white-space: nowrap;
        }
        .ap-qty-pill.qty-ok { background: rgba(16,185,129,0.1); color: #065f46; }
        .ap-qty-pill.qty-low { background: rgba(245,158,11,0.12); color: #92400e; }
        .ap-qty-pill.qty-out { background: rgba(220,38,38,0.1); color: #b91c1c; }
        .ap-badge {
          display: inline-flex; align-items: center; gap: 0.25rem;
          font-size: 0.65rem; font-weight: 800;
          padding: 0.2rem 0.5rem; border-radius: 999px; white-space: nowrap;
        }
        .badge-sale { background: rgba(239,68,68,0.12); color: #b91c1c; }
        .badge-new  { background: rgba(192,22,27,0.12); color: var(--primary); }
        .ap-no-badge { color: var(--muted-foreground); }

        /* Actions */
        .ap-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.375rem; }
        .ap-action-btn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 0.5rem; cursor: pointer;
          transition: all 0.2s; text-decoration: none; border: none;
        }
        .ap-action-btn.edit { background: rgba(59,130,246,0.1); color: #3b82f6; }
        .ap-action-btn.edit:hover { background: rgba(59,130,246,0.2); }
        .ap-action-btn.delete { background: rgba(220,38,38,0.08); color: #ef4444; }
        .ap-action-btn.delete:hover { background: rgba(220,38,38,0.16); }
        .ap-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ap-spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(220,38,38,0.3);
          border-top-color: #ef4444;
          animation: ap-spin 0.7s linear infinite;
        }

        /* Empty */
        .ap-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 4rem 2rem; text-align: center;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1.25rem;
        }
        .ap-empty-icon { width: 56px; height: 56px; color: var(--muted-foreground); opacity: 0.3; margin-bottom: 1rem; }
        .ap-empty h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.35rem; }
        .ap-empty p { color: var(--muted-foreground); font-size: 0.875rem; margin-bottom: 1.5rem; }
        .ap-empty-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--primary); color: #fff;
          padding: 0.6rem 1.25rem; border-radius: 999px;
          font-weight: 700; font-size: 0.875rem;
          text-decoration: none;
        }

        /* Skeleton */
        .ap-skeleton-table {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1.25rem; overflow: hidden; padding: 0;
        }
        .ap-skeleton-head { height: 42px; background: var(--muted); }
        .ap-skeleton-row {
          display: flex; gap: 1.5rem; align-items: center;
          padding: 0.875rem 1rem;
          border-top: 1px solid var(--border);
        }
        .ap-skeleton {
          background: linear-gradient(90deg, var(--muted) 25%, var(--accent) 50%, var(--muted) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 0.375rem; height: 12px;
        }
        .ap-sk-sm { width: 60px; }
        .ap-sk-md { width: 100px; }
        .ap-sk-lg { width: 160px; }

        /* Flag toggle buttons */
        .ap-flag-toggle {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 0.5rem;
          border: 1.5px solid var(--border); cursor: pointer;
          background: var(--card); transition: all 0.2s;
          color: var(--muted-foreground);
        }
        .ap-flag-toggle:hover:not(:disabled) { border-color: var(--foreground); }
        .ap-flag-toggle.on.popular { background: rgba(245,158,11,0.12); border-color: #f59e0b; color: #d97706; }
        .ap-flag-toggle.on.best { background: rgba(239,68,68,0.12); border-color: #ef4444; color: #b91c1c; }
        .ap-flag-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
