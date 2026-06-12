"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function EditHeroSlidePage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isRtl = locale === "ar";
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    bgImg: "",
    tagEn: "",
    tagAr: "",
    titleEn: "",
    titleAr: "",
    subEn: "",
    subAr: "",
    accent: "#C0161B",
    bgGradient: "from-[#0f1923] via-[#1a2535] to-[#0f1923]",
    sortOrder: 0,
    isActive: true,
  });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  useEffect(() => {
    adminApi.getHeroSlide(Number(params.id)).then((res) => {
      const s = res.data;
      setForm({
        bgImg: s.bgImg,
        tagEn: s.tagEn,
        tagAr: s.tagAr,
        titleEn: s.titleEn,
        titleAr: s.titleAr,
        subEn: s.subEn,
        subAr: s.subAr,
        accent: s.accent,
        bgGradient: s.bgGradient,
        sortOrder: s.sortOrder,
        isActive: s.isActive,
      });
    }).catch(() => router.push("/admin/hero-slides")).finally(() => setLoading(false));
  }, [params.id, router]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/upload", { method: "POST", body });
      const json = await res.json();
      if (json.url) set("bgImg", json.url);
    } catch {}
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminApi.updateHeroSlide(Number(params.id), form);
      router.push("/admin/hero-slides");
    } catch (err: any) {
      setError(err.message || (isRtl ? "حدث خطأ ما" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="cf-root">
      <div className="cf-header">
        <Link href="/admin/hero-slides" className="cf-back">
          <ArrowLeft className="size-4" />
          {isRtl ? "العودة للشرائح" : "Back to Slides"}
        </Link>
        <div className="cf-title-row">
          <div className="cf-title-icon" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            <ImageIcon className="size-5 text-white" />
          </div>
          <div>
            <h1 className="cf-title">{isRtl ? "تعديل الشريحة" : "Edit Hero Slide"}</h1>
            <p className="cf-sub">{form.titleEn}</p>
          </div>
        </div>
      </div>

      {error && <div className="cf-error">{error}</div>}

      <form onSubmit={handleSubmit} className="cf-form">
        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "الصورة والخلفية" : "Image & Background"}</h2>
          <div className="cf-grid-2">
            <div className="cf-field cf-field-full">
              <label className="cf-label">{isRtl ? "صورة الخلفية" : "Background Image"} <span className="cf-req">*</span></label>
              <div className="cf-img-upload">
                <div className="cf-img-preview">
                  {form.bgImg ? (
                    <img src={form.bgImg} alt="" className="cf-img-thumb" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="cf-img-placeholder"><ImageIcon className="size-8 text-muted-foreground/40" /></div>
                  )}
                </div>
                <div className="cf-img-inputs">
                  <div className="cf-img-row">
                    <input className="cf-input" value={form.bgImg} onChange={e => set("bgImg", e.target.value)} required placeholder={isRtl ? "رابط الصورة" : "Image URL"} />
                    <label className={`cf-upload-btn ${uploading ? "loading" : ""}`}>
                      {uploading ? <div className="cf-btn-spinner" /> : <Upload className="size-4" />}
                      <input type="file" accept="image/*" onChange={handleUpload} hidden disabled={uploading} />
                    </label>
                  </div>
                  <p className="cf-field-hint">{isRtl ? "أدخل رابطاً أو انقر على زر الرفع لاختيار صورة" : "Enter a URL or click the upload button to choose an image"}</p>
                </div>
              </div>
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "لون الإطار" : "Accent Color"}</label>
              <div className="cf-color-wrap">
                <input className="cf-color-picker" type="color" value={form.accent} onChange={e => set("accent", e.target.value)} />
                <input className="cf-input cf-color-text" value={form.accent} onChange={e => set("accent", e.target.value)} placeholder="#C0161B" />
              </div>
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "التدرج اللوني" : "Gradient"}</label>
              <select className="cf-input cf-select" value={form.bgGradient} onChange={e => set("bgGradient", e.target.value)}>
                <option value="from-[#0f1923] via-[#1a2535] to-[#0f1923]">داكن (أزرق غامق)</option>
                <option value="from-[#1a0808] via-[#2a1010] to-[#1a0808]">داكن (أحمر غامق)</option>
                <option value="from-[#0a1020] via-[#0f1830] to-[#0a1020]">داكن (كحلي غامق)</option>
                <option value="from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">داكن (نيلي)</option>
                <option value="from-[#1a0a0a] via-[#2a1a1a] to-[#1a0a0a]">داكن (بني غامق)</option>
                <option value="from-[#0a1a0a] via-[#1a2a1a] to-[#0a1a0a]">داكن (أخضر غامق)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "معاينة حية" : "Live Preview"}</h2>
          <div className="cf-preview-box" style={{ background: `linear-gradient(135deg, ${form.accent}22, ${form.accent}11)`, border: `1px solid ${form.accent}33` }}>
            <div className="cf-preview-badge" style={{ background: form.accent + "25", color: form.accent, border: `1px solid ${form.accent}40` }}>
              ✦ {form.tagAr || form.tagEn || (isRtl ? "الوسم" : "Tag")}
            </div>
            <div className="cf-preview-title">{form.titleAr || form.titleEn || (isRtl ? "العنوان" : "Title")}</div>
            <div className="cf-preview-sub">{form.subAr || form.subEn || (isRtl ? "الوصف" : "Subtitle")}</div>
            {form.bgImg && (
              <img src={form.bgImg} alt="" className="cf-preview-bg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
          </div>
        </div>

        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "النصوص" : "Text Content"}</h2>
          <div className="cf-grid-2">
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "الوسم (إنجليزي)" : "Tag (English)"}</label>
              <input className="cf-input" value={form.tagEn} onChange={e => set("tagEn", e.target.value)} />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "الوسم (عربي)" : "Tag (Arabic)"}</label>
              <input className="cf-input" value={form.tagAr} onChange={e => set("tagAr", e.target.value)} dir="rtl" />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "العنوان (إنجليزي)" : "Title (English)"}</label>
              <input className="cf-input" value={form.titleEn} onChange={e => set("titleEn", e.target.value)} />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "العنوان (عربي)" : "Title (Arabic)"}</label>
              <input className="cf-input" value={form.titleAr} onChange={e => set("titleAr", e.target.value)} dir="rtl" />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "الوصف (إنجليزي)" : "Subtitle (English)"}</label>
              <input className="cf-input" value={form.subEn} onChange={e => set("subEn", e.target.value)} />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "الوصف (عربي)" : "Subtitle (Arabic)"}</label>
              <input className="cf-input" value={form.subAr} onChange={e => set("subAr", e.target.value)} dir="rtl" />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "ترتيب الظهور" : "Sort Order"}</label>
              <input className="cf-input" type="number" min="0" value={form.sortOrder} onChange={e => set("sortOrder", Number(e.target.value))} />
            </div>
            <div className="cf-field cf-field-full">
              <label className="cf-checkbox-label">
                <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} />
                <span>{isRtl ? "نشط (يظهر في الصفحة الرئيسية)" : "Active (shown on homepage)"}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="cf-actions">
          <button type="submit" disabled={saving} className="cf-save-btn" style={{ background: "#7c3aed" }}>
            {saving ? (
              <><div className="cf-btn-spinner" />{isRtl ? "جاري الحفظ..." : "Saving..."}</>
            ) : (
              <><Save className="size-4" />{isRtl ? "حفظ التغييرات" : "Save Changes"}</>
            )}
          </button>
          <Link href="/admin/hero-slides" className="cf-cancel-btn">{isRtl ? "إلغاء" : "Cancel"}</Link>
        </div>
      </form>

      <style>{`
        .cf-root { display: flex; flex-direction: column; gap: 1.5rem; max-width: 720px; }
        .cf-header { display: flex; flex-direction: column; gap: 1rem; }
        .cf-back { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.83rem; color: var(--muted-foreground); text-decoration: none; transition: color 0.2s; width: fit-content; }
        .cf-back:hover { color: var(--foreground); }
        .cf-title-row { display: flex; align-items: center; gap: 0.875rem; }
        .cf-title-icon { width: 52px; height: 52px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.2); }
        .cf-title { font-size: 1.5rem; font-weight: 800; }
        .cf-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
        .cf-error { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.25); color: #b91c1c; border-radius: 0.875rem; padding: 0.875rem 1rem; font-size: 0.875rem; font-weight: 500; }
        .cf-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .cf-section { background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.375rem; display: flex; flex-direction: column; gap: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
        .cf-section-title { font-size: 0.875rem; font-weight: 800; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); margin-bottom: 0.25rem; }
        .cf-grid-2 { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
        @media (min-width: 560px) { .cf-grid-2 { grid-template-columns: 1fr 1fr; } }
        .cf-field-full { grid-column: 1 / -1; }
        .cf-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .cf-label { font-size: 0.78rem; font-weight: 700; color: var(--foreground); }
        .cf-req { color: #ef4444; }
        .cf-input { background: var(--background); border: 1.5px solid var(--border); border-radius: 0.75rem; padding: 0.6rem 0.875rem; font-size: 0.875rem; color: var(--foreground); font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%; }
        .cf-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(192,22,27,0.12); }
        .cf-checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; padding-top: 0.5rem; }
        .cf-checkbox-label input { width: 18px; height: 18px; accent-color: #7c3aed; }
        .cf-actions { display: flex; align-items: center; gap: 0.75rem; padding-top: 0.5rem; }
        .cf-save-btn { display: inline-flex; align-items: center; gap: 0.5rem; color: #fff; padding: 0.7rem 1.5rem; border-radius: 999px; font-weight: 800; font-size: 0.875rem; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 14px rgba(0,0,0,0.2); }
        .cf-save-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .cf-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cf-btn-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: cf-spin 0.7s linear infinite; }
        @keyframes cf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .cf-cancel-btn { display: inline-flex; align-items: center; padding: 0.7rem 1.25rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem; border: 1.5px solid var(--border); color: var(--muted-foreground); text-decoration: none; transition: all 0.2s; background: var(--card); }
        .cf-cancel-btn:hover { border-color: var(--foreground); color: var(--foreground); }
        .cf-img-upload { display: flex; gap: 1rem; align-items: flex-start; }
        .cf-img-preview { width: 120px; height: 68px; border-radius: 0.75rem; border: 1.5px solid var(--border); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--muted); }
        .cf-img-thumb { width: 100%; height: 100%; object-fit: cover; }
        .cf-img-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
        .cf-img-inputs { flex: 1; display: flex; flex-direction: column; gap: 0.375rem; }
        .cf-img-row { display: flex; gap: 0.5rem; align-items: center; }
        .cf-img-row .cf-input { flex: 1; }
        .cf-upload-btn { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 0.75rem; border: 1.5px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s; flex-shrink: 0; color: var(--muted-foreground); }
        .cf-upload-btn:hover { border-color: var(--primary); color: var(--primary); background: rgba(192,22,27,0.05); }
        .cf-upload-btn.loading { pointer-events: none; opacity: 0.6; }
        .cf-color-wrap { display: flex; gap: 0.5rem; align-items: center; }
        .cf-color-picker { width: 44px; height: 44px; border-radius: 0.6rem; border: 1.5px solid var(--border); cursor: pointer; padding: 2px; background: none; }
        .cf-color-picker::-webkit-color-swatch-wrapper { padding: 0; }
        .cf-color-picker::-webkit-color-swatch { border: none; border-radius: 0.4rem; }
        .cf-color-text { flex: 1; }
        .cf-select { cursor: pointer; }
        .cf-preview-box { position: relative; border-radius: 1.25rem; padding: 2rem; min-height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; overflow: hidden; }
        .cf-preview-badge { display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 999px; padding: 0.35rem 0.9rem; font-size: 0.7rem; font-weight: 700; }
        .cf-preview-title { font-size: 1.25rem; font-weight: 800; color: var(--foreground); }
        .cf-preview-sub { font-size: 0.8rem; color: var(--muted-foreground); }
        .cf-preview-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; border-radius: 1.25rem; }
      `}</style>
    </div>
  );
}
