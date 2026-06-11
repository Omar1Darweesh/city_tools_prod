"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { Plus, Image as ImageIcon, Pencil, Trash2, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import Image from "next/image";

export default function AdminHeroSlidesPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () =>
    adminApi.getHeroSlides().then((res) => setSlides(res.data || [])).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(isRtl ? "هل أنت متأكد من حذف هذه الشريحة؟" : "Are you sure you want to delete this slide?")) return;
    setDeleting(id);
    try {
      await adminApi.deleteHeroSlide(id);
      setSlides((prev) => prev.filter((s) => s.id !== id));
    } catch {}
    setDeleting(null);
  };

  return (
    <div className="st-root">
      <div className="st-header">
        <div>
          <h1 className="st-title">{isRtl ? "شرائح الهيرو" : "Hero Slides"}</h1>
          <p className="st-sub">{isRtl ? "إدارة شرائح القسم العلوي للصفحة الرئيسية" : "Manage homepage hero slider slides"}</p>
        </div>
        <Link href="/admin/hero-slides/new" className="st-add-btn" style={{ background: "#7c3aed" }}>
          <Plus className="size-4" />
          {isRtl ? "إضافة شريحة" : "Add Slide"}
        </Link>
      </div>

      {loading ? (
        <div className="st-loading"><Loader2 className="size-6 animate-spin" /></div>
      ) : slides.length === 0 ? (
        <div className="st-empty">
          <ImageIcon className="size-12 text-muted-foreground/30" />
          <p>{isRtl ? "لا توجد شرائح" : "No slides found"}</p>
        </div>
      ) : (
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>{isRtl ? "الصورة" : "Image"}</th>
                <th>{isRtl ? "الوسم" : "Tag"}</th>
                <th>{isRtl ? "العنوان" : "Title"}</th>
                <th>{isRtl ? "الترتيب" : "Order"}</th>
                <th>{isRtl ? "الحالة" : "Status"}</th>
                <th>{isRtl ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {slides.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="st-img-cell">
                      <Image src={s.bgImg} alt="" width={80} height={45} className="st-thumb" />
                    </div>
                  </td>
                  <td className="st-value">{s.tagAr || s.tagEn}</td>
                  <td>{s.titleAr || s.titleEn}</td>
                  <td>{s.sortOrder}</td>
                  <td>
                    <span className={`st-badge ${s.isActive ? "active" : "inactive"}`}>
                      {s.isActive ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive")}
                    </span>
                  </td>
                  <td>
                    <div className="st-actions">
                      <Link href={`/admin/hero-slides/${s.id}/edit`} className="st-action-btn edit">
                        <Pencil className="size-3.5" />
                      </Link>
                      <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} className="st-action-btn danger">
                        {deleting === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
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
        .st-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .st-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .st-title { font-size: 1.65rem; font-weight: 800; }
        .st-sub { font-size: 0.85rem; color: var(--muted-foreground); margin-top: 0.2rem; }
        .st-add-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: var(--primary); color: #fff; padding: 0.6rem 1.25rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem; text-decoration: none; transition: opacity 0.2s; box-shadow: 0 4px 16px rgba(192,22,27,0.3); }
        .st-add-btn:hover { opacity: 0.9; }
        .st-loading { display: flex; justify-content: center; padding: 4rem 0; color: var(--muted-foreground); }
        .st-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem 0; color: var(--muted-foreground); font-size: 0.9rem; }
        .st-table-wrap { overflow-x: auto; background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; }
        .st-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .st-table th { text-align: start; padding: 0.875rem 1rem; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--muted-foreground); border-bottom: 1px solid var(--border); background: var(--muted); }
        .st-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .st-table tr:last-child td { border-bottom: none; }
        .st-value { font-weight: 700; font-size: 1rem; }
        .st-img-cell { display: flex; align-items: center; }
        .st-thumb { border-radius: 0.5rem; object-fit: cover; border: 1px solid var(--border); }
        .st-badge { font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 999px; white-space: nowrap; }
        .st-badge.active { background: rgba(16,185,129,0.12); color: #065f46; }
        .st-badge.inactive { background: rgba(220,38,38,0.08); color: #b91c1c; }
        .st-actions { display: flex; gap: 0.35rem; }
        .st-action-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 0.5rem; border: none; cursor: pointer; transition: background 0.2s; }
        .st-action-btn.edit { background: var(--muted); color: var(--foreground); }
        .st-action-btn.edit:hover { background: var(--border); }
        .st-action-btn.danger { background: rgba(220,38,38,0.08); color: #b91c1c; }
        .st-action-btn.danger:hover { background: rgba(220,38,38,0.15); }
        .st-action-btn:disabled { opacity: 0.6; }
      `}</style>
    </div>
  );
}
