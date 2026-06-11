"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { Plus, Percent, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function AdminDiscountCardsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () =>
    adminApi.getDiscountCards().then((res) => setCards(res.data || [])).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(isRtl ? "هل أنت متأكد من حذف بطاقة الخصم هذه؟" : "Are you sure you want to delete this discount card?")) return;
    setDeleting(id);
    try {
      await adminApi.deleteDiscountCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  return (
    <div className="dc-root">
      <div className="dc-header">
        <div>
          <h1 className="dc-title">{isRtl ? "بطاقات الخصم" : "Discount Cards"}</h1>
          <p className="dc-sub">{isRtl ? "إدارة بطاقات العروض والخصم في الصفحة الرئيسية" : "Manage promo banners on the homepage"}</p>
        </div>
        <Link href="/admin/discount-cards/new" className="dc-add-btn">
          <Plus className="size-4" />
          {isRtl ? "إضافة بطاقة" : "Add Card"}
        </Link>
      </div>

      {loading ? (
        <div className="dc-loading"><Loader2 className="size-6 animate-spin" /></div>
      ) : cards.length === 0 ? (
        <div className="dc-empty">
          <Percent className="size-12 text-muted-foreground/30" />
          <p>{isRtl ? "لا توجد بطاقات خصم" : "No discount cards found"}</p>
        </div>
      ) : (
        <div className="dc-list">
          {cards.map((card) => (
            <div key={card.id} className={`dc-card ${card.isActive ? "" : "inactive"}`}>
              <div className="dc-card-header">
                <div className="dc-card-badge" style={{ background: "rgba(192,22,27,0.15)", color: "#e83030", border: "1px solid rgba(192,22,27,0.3)" }}>
                  ✦ {isRtl ? card.badgeAr : card.badgeEn}
                </div>
                <div className="dc-card-status">
                  <span className={`dc-badge ${card.isActive ? "active" : "inactive"}`}>
                    {card.isActive ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive")}
                  </span>
                </div>
              </div>
              <h3 className="dc-card-title">{isRtl ? card.titleAr : card.titleEn}</h3>
              <p className="dc-card-desc">{isRtl ? card.descAr : card.descEn}</p>
              <div className="dc-card-link-row">
                <ExternalLink className="size-3.5 text-muted-foreground" />
                <span className="dc-card-link">{card.linkUrl}</span>
                <span className="dc-card-btn-label">→ {isRtl ? card.linkLabelAr : card.linkLabelEn}</span>
              </div>
              <div className="dc-actions">
                <Link href={`/admin/discount-cards/${card.id}/edit`} className="dc-action-btn edit">
                  <Pencil className="size-3.5" />
                  {isRtl ? "تعديل" : "Edit"}
                </Link>
                <button onClick={() => handleDelete(card.id)} disabled={deleting === card.id} className="dc-action-btn danger">
                  {deleting === card.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  {isRtl ? "حذف" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .dc-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .dc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .dc-title { font-size: 1.65rem; font-weight: 800; }
        .dc-sub { font-size: 0.85rem; color: var(--muted-foreground); margin-top: 0.2rem; }
        .dc-add-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: var(--primary); color: #fff; padding: 0.6rem 1.25rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem; text-decoration: none; transition: opacity 0.2s; box-shadow: 0 4px 16px rgba(192,22,27,0.3); }
        .dc-add-btn:hover { opacity: 0.9; }
        .dc-loading { display: flex; justify-content: center; padding: 4rem 0; color: var(--muted-foreground); }
        .dc-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem 0; color: var(--muted-foreground); font-size: 0.9rem; }
        .dc-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1rem; }
        .dc-card { background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; transition: box-shadow 0.2s; }
        .dc-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .dc-card.inactive { opacity: 0.65; }
        .dc-card-header { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
        .dc-card-badge { display: inline-flex; border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.7rem; font-weight: 700; }
        .dc-badge { font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 999px; white-space: nowrap; }
        .dc-badge.active { background: rgba(16,185,129,0.12); color: #065f46; }
        .dc-badge.inactive { background: rgba(220,38,38,0.08); color: #b91c1c; }
        .dc-card-title { font-size: 1.1rem; font-weight: 800; }
        .dc-card-desc { font-size: 0.83rem; color: var(--muted-foreground); }
        .dc-card-link-row { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--muted-foreground); padding: 0.5rem 0; border-top: 1px solid var(--border); }
        .dc-card-link { font-family: monospace; font-size: 0.75rem; }
        .dc-card-btn-label { margin-inline-start: auto; font-weight: 600; color: var(--primary); }
        .dc-actions { display: flex; gap: 0.5rem; padding-top: 0.25rem; border-top: 1px solid var(--border); }
        .dc-action-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.75rem; border-radius: 0.625rem; font-size: 0.78rem; font-weight: 600; border: none; cursor: pointer; text-decoration: none; transition: background 0.2s; }
        .dc-action-btn.edit { background: var(--muted); color: var(--foreground); }
        .dc-action-btn.edit:hover { background: var(--border); }
        .dc-action-btn.danger { background: rgba(220,38,38,0.08); color: #b91c1c; }
        .dc-action-btn.danger:hover { background: rgba(220,38,38,0.15); }
        .dc-action-btn:disabled { opacity: 0.6; }
      `}</style>
    </div>
  );
}
