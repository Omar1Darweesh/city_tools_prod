"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { categoryFormStyles } from "../../new/page";

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

export default function EditCategoryPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isRtl = locale === "ar";

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", nameAr: "", slug: "", color: "#C0161B", icon: "Wrench" });

  useEffect(() => {
    adminApi.getCategory(Number(params.id))
      .then((res) => {
        const c = res.data || res;
        if (c) {
          setForm({
            name: c.name || "",
            nameAr: c.nameAr || "",
            slug: c.slug || "",
            color: c.color || "#C0161B",
            icon: c.icon || "Wrench",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminApi.updateCategory(Number(params.id), form);
      router.push("/admin/categories");
    } catch (err: any) {
      setError(err.message || (isRtl ? "حدث خطأ ما" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  const selectedIcon = iconOptions.find(i => i.value === form.icon);

  if (loading) {
    return (
      <div className="cf-root">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "3rem", color: "var(--muted-foreground)" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--primary)", animation: "cf-spin 0.8s linear infinite" }} />
          <p>{isRtl ? "جاري تحميل بيانات القسم..." : "Loading category data..."}</p>
        </div>
        <style>{categoryFormStyles}</style>
      </div>
    );
  }

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
            <h1 className="cf-title">{isRtl ? "تعديل القسم" : "Edit Category"}</h1>
            <p className="cf-sub">{form.name || (isRtl ? "القسم" : "Category")} · /{form.slug}</p>
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
                onChange={e => set("name", e.target.value)}
                required
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
          {/* Live Preview */}
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
              <><Save className="size-4" />{isRtl ? "تحديث القسم" : "Update Category"}</>
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
