"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { Plus, Shield, Pencil, Trash2, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

const ICON_OPTIONS = [
  "Truck", "Shield", "BadgePercent", "HeadphonesIcon",
  "Zap", "Wrench", "Package", "Bolt", "Droplets", "Factory", "Star", "Check",
  "DollarSign",
];

export default function AdminTrustFeaturesPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () =>
    adminApi.getTrustFeatures().then((res: any) => setItems(res.data || [])).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(isRtl ? "هل أنت متأكد من الحذف؟" : "Are you sure?")) return;
    setDeleting(id);
    try {
      await adminApi.deleteTrustFeature(id);
      setItems((prev) => prev.filter((t) => t.id !== id));
    } catch {}
    setDeleting(null);
  };

  return (
    <div className="tf-root">
      <div className="tf-header">
        <div>
          <h1 className="tf-title">{isRtl ? "مميزات الموقع" : "Trust Features"}</h1>
          <p className="tf-sub">{isRtl ? "إدارة مميزات الثقة في الصفحة الرئيسية" : "Manage trust bar features on the homepage"}</p>
        </div>
        <Link href="/admin/trust-features/new" className="tf-add-btn">
          <Plus className="size-4" />
          {isRtl ? "إضافة ميزة" : "Add Feature"}
        </Link>
      </div>

      {loading ? (
        <div className="tf-loading"><Loader2 className="size-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="tf-empty">
          <Shield className="size-12 text-muted-foreground/30" />
          <p>{isRtl ? "لا توجد مميزات" : "No trust features"}</p>
        </div>
      ) : (
        <div className="tf-table-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>{isRtl ? "الأيقونة" : "Icon"}</th>
                <th>{isRtl ? "العنوان" : "Title"}</th>
                <th>{isRtl ? "النص الفرعي" : "Subtitle"}</th>
                <th>{isRtl ? "الترتيب" : "Order"}</th>
                <th>{isRtl ? "الحالة" : "Status"}</th>
                <th className="tf-th-actions">{isRtl ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td><span className="tf-icon-badge">{t.icon}</span></td>
                  <td className="tf-cell-title">{isRtl ? t.titleAr : t.titleEn}</td>
                  <td className="tf-cell-sub">{isRtl ? t.subtitleAr : t.subtitleEn}</td>
                  <td>{t.sortOrder}</td>
                  <td>
                    <span className={`tf-status ${t.isActive ? "active" : ""}`}>
                      {t.isActive ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive")}
                    </span>
                  </td>
                  <td>
                    <div className="tf-actions">
                      <Link href={`/admin/trust-features/${t.id}/edit`} className="tf-action-btn edit">
                        <Pencil className="size-3.5" />
                      </Link>
                      <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id} className="tf-action-btn danger">
                        {deleting === t.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
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
        .tf-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .tf-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .tf-title { font-size: 1.5rem; font-weight: 800; }
        .tf-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
        .tf-add-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary); color: #fff; padding: 0.6rem 1.25rem; border-radius: 999px; font-weight: 700; font-size: 0.85rem; text-decoration: none; transition: opacity 0.2s; white-space: nowrap; }
        .tf-add-btn:hover { opacity: 0.9; }
        .tf-loading { display: flex; justify-content: center; padding: 3rem; }
        .tf-empty { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: var(--muted-foreground); }
        .tf-table-wrap { background: var(--card); border: 1px solid var(--border); border-radius: 1rem; overflow: hidden; }
        .tf-table { width: 100%; border-collapse: collapse; }
        .tf-table th { text-align: start; font-size: 0.72rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.05em; padding: 0.875rem 1rem; border-bottom: 1px solid var(--border); background: var(--muted/30); }
        .tf-table td { padding: 0.75rem 1rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .tf-table tr:last-child td { border-bottom: none; }
        .tf-table tr:hover td { background: var(--muted/20); }
        .tf-th-actions { text-align: end; }
        .tf-cell-title { font-weight: 600; }
        .tf-cell-sub { color: var(--muted-foreground); font-size: 0.8rem; }
        .tf-icon-badge { font-size: 0.72rem; font-weight: 700; background: var(--accent); color: var(--primary); padding: 0.2rem 0.5rem; border-radius: 0.4rem; }
        .tf-status { font-size: 0.72rem; font-weight: 600; color: var(--muted-foreground); }
        .tf-status.active { color: #16a34a; }
        .tf-actions { display: flex; align-items: center; gap: 0.3rem; justify-content: flex-end; }
        .tf-action-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.5rem; border-radius: 0.5rem; font-size: 0.78rem; border: none; cursor: pointer; text-decoration: none; transition: all 0.2s; background: var(--muted); color: var(--foreground); }
        .tf-action-btn:hover { opacity: 0.8; }
        .tf-action-btn.danger { color: #dc2626; }
        .tf-action-btn.danger:hover { background: rgba(220,38,38,0.1); }
      `}</style>
    </div>
  );
}
