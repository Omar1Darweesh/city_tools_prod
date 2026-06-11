"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Layers } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function NewSubcategoryPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    adminApi.getCategories()
      .then(res => {
        const cats = res.data || [];
        setCategories(cats);
        if (cats.length > 0) setCategoryId(String(cats[0].id));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nameAr.trim() || !categoryId) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.createSubcategory({ name: name.trim(), nameAr: nameAr.trim(), categoryId: Number(categoryId) });
      router.push("/admin/subcategories");
    } catch (err: any) {
      setError(err.message || (isRtl ? "حدث خطأ ما" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ascf-root">
      <div className="ascf-header">
        <Link href="/admin/subcategories" className="ascf-back">
          <ArrowLeft className="size-4" />
          {isRtl ? "العودة للتصنيفات الفرعية" : "Back to Subcategories"}
        </Link>
        <div className="ascf-title-row">
          <div className="ascf-title-icon">
            <Layers className="size-5 text-white" />
          </div>
          <div>
            <h1 className="ascf-title">{isRtl ? "إضافة تصنيف فرعي" : "Add Subcategory"}</h1>
            <p className="ascf-sub">{isRtl ? "أضف تصنيفاً فرعياً جديداً" : "Add a new subcategory"}</p>
          </div>
        </div>
      </div>

      {error && <div className="ascf-error">{error}</div>}

      <form onSubmit={handleSubmit} className="ascf-form">
        <div className="ascf-section">
          <div className="ascf-grid">
            <div className="ascf-field">
              <label className="ascf-label">{isRtl ? "الاسم بالإنجليزية" : "Name (English)"} <span className="ascf-req">*</span></label>
              <input className="ascf-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="ascf-field">
              <label className="ascf-label">{isRtl ? "الاسم بالعربية" : "Name (Arabic)"} <span className="ascf-req">*</span></label>
              <input className="ascf-input" value={nameAr} onChange={e => setNameAr(e.target.value)} required dir="rtl" />
            </div>
            <div className="ascf-field">
              <label className="ascf-label">{isRtl ? "القسم الرئيسي" : "Category"} <span className="ascf-req">*</span></label>
              <select className="ascf-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{isRtl ? c.nameAr : c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="ascf-actions">
          <button type="submit" disabled={saving} className="ascf-save-btn">
            {saving ? (
              <><div className="ascf-btn-spinner" />{isRtl ? "جاري الحفظ..." : "Saving..."}</>
            ) : (
              <><Save className="size-4" />{isRtl ? "حفظ" : "Save"}</>
            )}
          </button>
          <Link href="/admin/subcategories" className="ascf-cancel-btn">
            {isRtl ? "إلغاء" : "Cancel"}
          </Link>
        </div>
      </form>

      <style>{ascfStyles}</style>
    </div>
  );
}

const ascfStyles = `
  .ascf-root { display: flex; flex-direction: column; gap: 1.5rem; max-width: 640px; }
  .ascf-header { display: flex; flex-direction: column; gap: 1rem; }
  .ascf-back { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.83rem; color: var(--muted-foreground); text-decoration: none; transition: color 0.2s; width: fit-content; }
  .ascf-back:hover { color: var(--foreground); }
  .ascf-title-row { display: flex; align-items: center; gap: 0.875rem; }
  .ascf-title-icon { width: 48px; height: 48px; border-radius: 0.875rem; background: linear-gradient(135deg, #8b5cf6, #6d28d9); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(139,92,246,0.3); }
  .ascf-title { font-size: 1.5rem; font-weight: 800; }
  .ascf-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
  .ascf-error { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.25); color: #b91c1c; border-radius: 0.875rem; padding: 0.875rem 1rem; font-size: 0.875rem; font-weight: 500; }
  .ascf-form { display: flex; flex-direction: column; gap: 1.25rem; }
  .ascf-section { background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.375rem; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
  .ascf-grid { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
  @media (min-width: 560px) { .ascf-grid { grid-template-columns: 1fr 1fr; } }
  .ascf-field { display: flex; flex-direction: column; gap: 0.375rem; }
  .ascf-label { font-size: 0.78rem; font-weight: 700; color: var(--foreground); }
  .ascf-req { color: #ef4444; }
  .ascf-input, .ascf-select { background: var(--background); border: 1.5px solid var(--border); border-radius: 0.75rem; padding: 0.6rem 0.875rem; font-size: 0.875rem; color: var(--foreground); font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%; }
  .ascf-input:focus, .ascf-select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(192,22,27,0.12); }
  .ascf-actions { display: flex; align-items: center; gap: 0.75rem; }
  .ascf-save-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary); color: #fff; padding: 0.7rem 1.5rem; border-radius: 999px; font-weight: 800; font-size: 0.875rem; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 14px rgba(192,22,27,0.3); }
  .ascf-save-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .ascf-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .ascf-btn-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: ascf-spin 0.7s linear infinite; }
  @keyframes ascf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .ascf-cancel-btn { display: inline-flex; align-items: center; padding: 0.7rem 1.25rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem; border: 1.5px solid var(--border); color: var(--muted-foreground); text-decoration: none; transition: all 0.2s; background: var(--card); }
  .ascf-cancel-btn:hover { border-color: var(--foreground); color: var(--foreground); }
`;
