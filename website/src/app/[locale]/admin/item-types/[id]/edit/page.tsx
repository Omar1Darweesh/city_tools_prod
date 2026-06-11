"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Save, List } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function EditItemTypePage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isRtl = locale === "ar";

  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");

  useEffect(() => {
    const id = Number(params.id);
    if (!id) { setError("Invalid ID"); setLoading(false); return; }

    adminApi.getSubcategories()
      .then(res => setSubcategories(res.data || []))
      .catch(() => {});

    adminApi.getItemTypes()
      .then((res) => {
        const item = (res.data || []).find((t: any) => t.id === id);
        if (!item) {
          setError(isRtl ? "لم يتم العثور على النوع" : "Item type not found");
          return;
        }
        setName(item.name || "");
        setNameAr(item.nameAr || "");
        setSubcategoryId(String(item.subcategoryId ?? ""));
      })
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nameAr.trim() || !subcategoryId) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.updateItemType(Number(params.id), { name: name.trim(), nameAr: nameAr.trim(), subcategoryId: Number(subcategoryId) });
      router.push("/admin/item-types");
    } catch (err: any) {
      setError(err.message || (isRtl ? "حدث خطأ ما" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="aitf-root">
        <div className="aitf-loading">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        <style>{aitfStyles}</style>
      </div>
    );
  }

  return (
    <div className="aitf-root">
      <div className="aitf-header">
        <Link href="/admin/item-types" className="aitf-back">
          <ArrowLeft className="size-4" />
          {isRtl ? "العودة للأنواع" : "Back to Item Types"}
        </Link>
        <div className="aitf-title-row">
          <div className="aitf-title-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
            <List className="size-5 text-white" />
          </div>
          <div>
            <h1 className="aitf-title">{isRtl ? "تعديل النوع" : "Edit Item Type"}</h1>
            <p className="aitf-sub">{name || `#${params.id}`}</p>
          </div>
        </div>
      </div>

      {error && <div className="aitf-error">{error}</div>}

      <form onSubmit={handleSubmit} className="aitf-form">
        <div className="aitf-section">
          <div className="aitf-grid">
            <div className="aitf-field">
              <label className="aitf-label">{isRtl ? "الاسم بالإنجليزية" : "Name (English)"} <span className="aitf-req">*</span></label>
              <input className="aitf-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="aitf-field">
              <label className="aitf-label">{isRtl ? "الاسم بالعربية" : "Name (Arabic)"} <span className="aitf-req">*</span></label>
              <input className="aitf-input" value={nameAr} onChange={e => setNameAr(e.target.value)} required dir="rtl" />
            </div>
            <div className="aitf-field">
              <label className="aitf-label">{isRtl ? "التصنيف الفرعي" : "Subcategory"} <span className="aitf-req">*</span></label>
              <select className="aitf-select" value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} required>
                {subcategories.map(sc => (
                  <option key={sc.id} value={sc.id}>{isRtl ? sc.nameAr : sc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="aitf-actions">
          <button type="submit" disabled={saving} className="aitf-save-btn">
            {saving ? (
              <><div className="aitf-btn-spinner" />{isRtl ? "جاري الحفظ..." : "Saving..."}</>
            ) : (
              <><Save className="size-4" />{isRtl ? "تحديث" : "Update"}</>
            )}
          </button>
          <Link href="/admin/item-types" className="aitf-cancel-btn">
            {isRtl ? "إلغاء" : "Cancel"}
          </Link>
        </div>
      </form>

      <style>{aitfStyles}</style>
      <style>{`.aitf-loading { padding: 2rem; color: var(--muted-foreground); }`}</style>
    </div>
  );
}

const aitfStyles = `
  .aitf-root { display: flex; flex-direction: column; gap: 1.5rem; max-width: 640px; }
  .aitf-header { display: flex; flex-direction: column; gap: 1rem; }
  .aitf-back { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.83rem; color: var(--muted-foreground); text-decoration: none; transition: color 0.2s; width: fit-content; }
  .aitf-back:hover { color: var(--foreground); }
  .aitf-title-row { display: flex; align-items: center; gap: 0.875rem; }
  .aitf-title-icon { width: 48px; height: 48px; border-radius: 0.875rem; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
  .aitf-title { font-size: 1.5rem; font-weight: 800; }
  .aitf-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
  .aitf-error { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.25); color: #b91c1c; border-radius: 0.875rem; padding: 0.875rem 1rem; font-size: 0.875rem; font-weight: 500; }
  .aitf-form { display: flex; flex-direction: column; gap: 1.25rem; }
  .aitf-section { background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.375rem; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
  .aitf-grid { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
  @media (min-width: 560px) { .aitf-grid { grid-template-columns: 1fr 1fr; } }
  .aitf-field { display: flex; flex-direction: column; gap: 0.375rem; }
  .aitf-label { font-size: 0.78rem; font-weight: 700; color: var(--foreground); }
  .aitf-req { color: #ef4444; }
  .aitf-input, .aitf-select { background: var(--background); border: 1.5px solid var(--border); border-radius: 0.75rem; padding: 0.6rem 0.875rem; font-size: 0.875rem; color: var(--foreground); font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%; }
  .aitf-input:focus, .aitf-select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(192,22,27,0.12); }
  .aitf-actions { display: flex; align-items: center; gap: 0.75rem; }
  .aitf-save-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary); color: #fff; padding: 0.7rem 1.5rem; border-radius: 999px; font-weight: 800; font-size: 0.875rem; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 14px rgba(192,22,27,0.3); }
  .aitf-save-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .aitf-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .aitf-btn-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: aitf-spin 0.7s linear infinite; }
  @keyframes aitf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .aitf-cancel-btn { display: inline-flex; align-items: center; padding: 0.7rem 1.25rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem; border: 1.5px solid var(--border); color: var(--muted-foreground); text-decoration: none; transition: all 0.2s; background: var(--card); }
  .aitf-cancel-btn:hover { border-color: var(--foreground); color: var(--foreground); }
`;
