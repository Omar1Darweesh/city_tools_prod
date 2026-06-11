"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

const colorOptions = [
  "#f97316", "#22c55e", "#eab308", "#06b6d4", "#ef4444",
  "#8b5cf6", "#2563eb", "#ec4899", "#14b8a6", "#f59e0b",
  "#C0161B", "#64748b", "#84cc16", "#a855f7", "#0ea5e9",
];

const iconOptions = [
  { value: "Zap",      emoji: "⚡", label: "Zap" },
  { value: "Wrench",   emoji: "🔧", label: "Wrench" },
  { value: "Bolt",     emoji: "🔩", label: "Bolt" },
  { value: "Droplets", emoji: "💧", label: "Droplets" },
  { value: "Shield",   emoji: "🛡️", label: "Shield" },
  { value: "Factory",  emoji: "🏭", label: "Factory" },
  { value: "Package",  emoji: "📦", label: "Package" },
  { value: "Settings", emoji: "⚙️", label: "Settings" },
  { value: "Tool",     emoji: "🛠️", label: "Tool" },
  { value: "Star",     emoji: "⭐", label: "Star" },
];

export default function NewCategoryPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", nameAr: "", slug: "", color: "#C0161B", icon: "Wrench" });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleNameChange = (val: string) => {
    set("name", val);
    if (!form.slug || form.slug === autoSlug(form.name)) {
      set("slug", autoSlug(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminApi.createCategory(form);
      router.push("/admin/categories");
    } catch (err: any) {
      setError(err.message || (isRtl ? "حدث خطأ ما" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  const selectedIcon = iconOptions.find(i => i.value === form.icon);

  return (
    <div className="cf-root">
      {/* Header */}
      <div className="cf-header">
        <Link href="/admin/categories" className="cf-back">
          <ArrowLeft className="size-4" />
          {isRtl ? "العودة للأقسام" : "Back to Categories"}
        </Link>
        <div className="cf-title-row">
          <div className="cf-title-icon" style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}bb)` }}>
            <span style={{ fontSize: "1.3rem" }}>{selectedIcon?.emoji || "📦"}</span>
          </div>
          <div>
            <h1 className="cf-title">{isRtl ? "إضافة قسم جديد" : "Add New Category"}</h1>
            <p className="cf-sub">{isRtl ? "أضف قسماً جديداً للمنتجات" : "Create a new product category"}</p>
          </div>
        </div>
      </div>

      {error && <div className="cf-error">{error}</div>}

      <form onSubmit={handleSubmit} className="cf-form">
        {/* Names */}
        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "معلومات القسم" : "Category Information"}</h2>
          <div className="cf-grid-2">
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "الاسم بالإنجليزية" : "Name (English)"} <span className="cf-req">*</span></label>
              <input
                className="cf-input"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                required
                placeholder="e.g. Power Tools"
              />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "الاسم بالعربية" : "Name (Arabic)"} <span className="cf-req">*</span></label>
              <input
                className="cf-input"
                value={form.nameAr}
                onChange={e => set("nameAr", e.target.value)}
                required
                dir="rtl"
                placeholder="مثال: أدوات كهربائية"
              />
            </div>
            <div className="cf-field cf-field-full">
              <label className="cf-label">Slug <span className="cf-req">*</span></label>
              <div className="cf-slug-wrap">
                <span className="cf-slug-prefix">/categories/</span>
                <input
                  className="cf-input cf-slug-input"
                  value={form.slug}
                  onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  placeholder="power-tools"
                  dir="ltr"
                />
              </div>
              <p className="cf-field-hint">{isRtl ? "يُستخدم في الرابط (بدون مسافات أو أحرف خاصة)" : "Used in URLs — no spaces or special characters"}</p>
            </div>
          </div>
        </div>

        {/* Color */}
        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "لون القسم" : "Category Color"}</h2>
          <div className="cf-colors-grid">
            {colorOptions.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => set("color", color)}
                className={`cf-color-btn ${form.color === color ? "selected" : ""}`}
                style={{ background: color }}
                title={color}
              >
                {form.color === color && <span className="cf-check">✓</span>}
              </button>
            ))}
            <div className="cf-color-custom">
              <label className="cf-label" style={{ fontSize: "0.7rem", marginBottom: "0.25rem" }}>
                {isRtl ? "مخصص" : "Custom"}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="color"
                  value={form.color}
                  onChange={e => set("color", e.target.value)}
                  className="cf-color-picker"
                />
                <span style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--muted-foreground)" }}>{form.color}</span>
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="cf-color-preview" style={{ background: `${form.color}18`, borderColor: `${form.color}40` }}>
            <div className="cf-preview-icon" style={{ background: form.color }}>
              <span style={{ fontSize: "1.1rem" }}>{selectedIcon?.emoji || "📦"}</span>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{form.name || (isRtl ? "اسم القسم" : "Category Name")}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{form.nameAr || (isRtl ? "الاسم العربي" : "Arabic Name")}</p>
            </div>
          </div>
        </div>

        {/* Icon */}
        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "أيقونة القسم" : "Category Icon"}</h2>
          <div className="cf-icons-grid">
            {iconOptions.map(icon => (
              <button
                key={icon.value}
                type="button"
                onClick={() => set("icon", icon.value)}
                className={`cf-icon-btn ${form.icon === icon.value ? "selected" : ""}`}
                style={form.icon === icon.value ? { borderColor: form.color, background: `${form.color}18` } : {}}
                title={icon.label}
              >
                <span className="cf-icon-emoji">{icon.emoji}</span>
                <span className="cf-icon-name">{icon.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="cf-actions">
          <button type="submit" disabled={saving} className="cf-save-btn" style={{ background: form.color }}>
            {saving ? (
              <><div className="cf-btn-spinner" />{isRtl ? "جاري الحفظ..." : "Saving..."}</>
            ) : (
              <><Save className="size-4" />{isRtl ? "حفظ القسم" : "Save Category"}</>
            )}
          </button>
          <Link href="/admin/categories" className="cf-cancel-btn">
            {isRtl ? "إلغاء" : "Cancel"}
          </Link>
        </div>
      </form>

      <style>{categoryFormStyles}</style>
    </div>
  );
}

export const categoryFormStyles = `
  .cf-root { display: flex; flex-direction: column; gap: 1.5rem; max-width: 720px; }

  .cf-header { display: flex; flex-direction: column; gap: 1rem; }
  .cf-back {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.83rem; color: var(--muted-foreground);
    text-decoration: none; transition: color 0.2s; width: fit-content;
  }
  .cf-back:hover { color: var(--foreground); }
  .cf-title-row { display: flex; align-items: center; gap: 0.875rem; }
  .cf-title-icon {
    width: 52px; height: 52px; border-radius: 1rem;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.2);
    transition: all 0.3s;
  }
  .cf-title { font-size: 1.5rem; font-weight: 800; }
  .cf-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }

  .cf-error {
    background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.25);
    color: #b91c1c; border-radius: 0.875rem; padding: 0.875rem 1rem;
    font-size: 0.875rem; font-weight: 500;
  }

  .cf-form { display: flex; flex-direction: column; gap: 1.25rem; }
  .cf-section {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 1.25rem; padding: 1.375rem;
    display: flex; flex-direction: column; gap: 1rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  }
  .cf-section-title {
    font-size: 0.875rem; font-weight: 800;
    padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);
    margin-bottom: 0.25rem;
  }

  .cf-grid-2 { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
  @media (min-width: 560px) { .cf-grid-2 { grid-template-columns: 1fr 1fr; } }
  .cf-field-full { grid-column: 1 / -1; }

  .cf-field { display: flex; flex-direction: column; gap: 0.375rem; }
  .cf-label { font-size: 0.78rem; font-weight: 700; color: var(--foreground); }
  .cf-req { color: #ef4444; }
  .cf-field-hint { font-size: 0.7rem; color: var(--muted-foreground); margin-top: 0.2rem; }
  .cf-input {
    background: var(--background); border: 1.5px solid var(--border);
    border-radius: 0.75rem; padding: 0.6rem 0.875rem;
    font-size: 0.875rem; color: var(--foreground);
    font-family: inherit; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
  }
  .cf-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(192,22,27,0.12); }

  .cf-slug-wrap {
    display: flex; align-items: center;
    background: var(--background); border: 1.5px solid var(--border);
    border-radius: 0.75rem; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .cf-slug-wrap:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(192,22,27,0.12); }
  .cf-slug-prefix {
    padding: 0.6rem 0.75rem; background: var(--muted);
    font-size: 0.78rem; color: var(--muted-foreground); font-family: monospace;
    border-inline-end: 1.5px solid var(--border); white-space: nowrap; flex-shrink: 0;
  }
  .cf-slug-input { border: none !important; border-radius: 0 !important; box-shadow: none !important; }

  /* Colors */
  .cf-colors-grid { display: flex; flex-wrap: wrap; gap: 0.625rem; align-items: flex-start; }
  .cf-color-btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 2px solid transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s, border-color 0.2s;
    flex-shrink: 0;
  }
  .cf-color-btn:hover { transform: scale(1.12); }
  .cf-color-btn.selected { border-color: var(--foreground); transform: scale(1.15); }
  .cf-check { color: white; font-size: 0.875rem; font-weight: 800; text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
  .cf-color-custom { display: flex; flex-direction: column; }
  .cf-color-picker {
    width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--border);
    cursor: pointer; padding: 0; overflow: hidden;
  }

  /* Preview */
  .cf-color-preview {
    display: flex; align-items: center; gap: 0.875rem;
    padding: 0.875rem 1rem; border-radius: 0.875rem;
    border: 1.5px solid; transition: all 0.3s;
  }
  .cf-preview-icon {
    width: 44px; height: 44px; border-radius: 0.75rem;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.3s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  /* Icons */
  .cf-icons-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 0.625rem; }
  .cf-icon-btn {
    display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
    padding: 0.75rem 0.5rem; border-radius: 0.75rem;
    border: 1.5px solid var(--border);
    cursor: pointer; background: var(--background);
    transition: all 0.2s;
  }
  .cf-icon-btn:hover { border-color: var(--muted-foreground); background: var(--muted); }
  .cf-icon-btn.selected { font-weight: 700; }
  .cf-icon-emoji { font-size: 1.4rem; }
  .cf-icon-name { font-size: 0.65rem; color: var(--muted-foreground); font-weight: 600; }

  /* Actions */
  .cf-actions { display: flex; align-items: center; gap: 0.75rem; padding-top: 0.5rem; }
  .cf-save-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    color: #fff; padding: 0.7rem 1.5rem; border-radius: 999px;
    font-weight: 800; font-size: 0.875rem;
    border: none; cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;
    box-shadow: 0 4px 14px rgba(0,0,0,0.2);
  }
  .cf-save-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .cf-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .cf-btn-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    animation: cf-spin 0.7s linear infinite;
  }
  @keyframes cf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .cf-cancel-btn {
    display: inline-flex; align-items: center;
    padding: 0.7rem 1.25rem; border-radius: 999px;
    font-weight: 700; font-size: 0.875rem;
    border: 1.5px solid var(--border);
    color: var(--muted-foreground); text-decoration: none;
    transition: all 0.2s; background: var(--card);
  }
  .cf-cancel-btn:hover { border-color: var(--foreground); color: var(--foreground); }
`;
