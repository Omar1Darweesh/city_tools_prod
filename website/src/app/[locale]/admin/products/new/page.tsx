"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Package } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import ProductImageUpload from "@/components/admin/product-image-upload";

const badgeOptions = [
  { value: "", labelEn: "None", labelAr: "لا يوجد" },
  { value: "SALE", labelEn: "Sale 🔴", labelAr: "تخفيض 🔴" },
  { value: "NEW",  labelEn: "New ✨",  labelAr: "جديد ✨" },
];

export default function NewProductPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "", nameEn: "", nameAr: "", priceRetail: "", priceWholesale: "",
    discountPrice: "", categoryId: "", subcategoryId: "", itemTypeId: "",
    brand: "", description: "",
    rating: "0", inStock: true, badge: "", isPopular: false, isBestSale: false,
    unit: "PCS", minQty: "1", stock: "0", images: "", barcode: "", cost: "",
  });

  useEffect(() => {
    adminApi.getCategories()
      .then((res) => {
        const cats = res.data || [];
        setCategories(cats);
        if (cats.length > 0) setForm(f => ({ ...f, categoryId: String(cats[0].id) }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cid = form.categoryId;
    setSubcategories([]);
    setForm(f => ({ ...f, subcategoryId: "", itemTypeId: "" }));
    if (!cid) return;
    adminApi.getSubcategories(Number(cid))
      .then(res => setSubcategories(res.data || []))
      .catch(() => {});
  }, [form.categoryId]);

  useEffect(() => {
    const scid = form.subcategoryId;
    setItemTypes([]);
    setForm(f => ({ ...f, itemTypeId: "" }));
    if (!scid) return;
    adminApi.getItemTypes(Number(scid))
      .then(res => setItemTypes(res.data || []))
      .catch(() => {});
  }, [form.subcategoryId]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const imageList = form.images
        ? form.images.split("||").map(s => s.trim()).filter(Boolean)
        : [];
      if (imageList.some(u => u.startsWith("data:"))) {
        setError(isRtl ? "يرجى إعادة رفع الصور — الصور المضمنة لا يمكن حفظها" : "Please re-upload images — embedded images cannot be saved");
        return;
      }

      const { stock: _s, inStock: _is, subcategoryId: _sub, ...restForm } = form;
      const payload = {
        ...restForm,
        priceRetail: Number(form.priceRetail),
        priceWholesale: Number(form.priceWholesale) || Number(form.priceRetail),
        cost: form.cost ? Number(form.cost) : Number(form.priceRetail),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        barcode: form.barcode || form.code,
        rating: Number(form.rating),
        categoryId: Number(form.categoryId),
        itemTypeId: form.itemTypeId ? Number(form.itemTypeId) : null,
        minQty: Number(form.minQty),
        initialStock: Number(form.stock) || 0,
        badge: form.badge || null,
        images: imageList,
      };
      await adminApi.createProduct(payload);
      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message || (isRtl ? "حدث خطأ ما" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pf-root">
      {/* Header */}
      <div className="pf-header">
        <Link href="/admin/products" className="pf-back">
          <ArrowLeft className="size-4" />
          {isRtl ? "العودة للمنتجات" : "Back to Products"}
        </Link>
        <div className="pf-title-row">
          <div className="pf-title-icon">
            <Package className="size-5 text-white" />
          </div>
          <div>
            <h1 className="pf-title">{isRtl ? "إضافة منتج جديد" : "Add New Product"}</h1>
            <p className="pf-sub">{isRtl ? "أضف منتجاً جديداً إلى قاعدة البيانات" : "Add a new product to the database"}</p>
          </div>
        </div>
      </div>

      {error && <div className="pf-error">{error}</div>}

      <form onSubmit={handleSubmit} className="pf-form">
        {/* Basic Info */}
        <div className="pf-section">
          <h2 className="pf-section-title">{isRtl ? "المعلومات الأساسية" : "Basic Information"}</h2>
          <div className="pf-grid-3">
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "كود المنتج" : "Product Code"} <span className="pf-req">*</span></label>
              <input className="pf-input" value={form.code} onChange={e => set("code", e.target.value)} required placeholder="e.g. PT-001" />
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "الباركود" : "Barcode"} <span className="pf-req">*</span></label>
              <input className="pf-input" value={form.barcode} onChange={e => set("barcode", e.target.value)} placeholder={isRtl ? "سيتم استخدام الكود إن لم يدخل" : "Defaults to code if empty"} />
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "وحدة القياس" : "Unit"}</label>
              <input className="pf-input" value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="PCS, KG, M..." />
            </div>
          </div>
          <div className="pf-grid-2">
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "الاسم بالإنجليزية" : "Name (English)"} <span className="pf-req">*</span></label>
              <input className="pf-input" value={form.nameEn} onChange={e => set("nameEn", e.target.value)} required />
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "الاسم بالعربية" : "Name (Arabic)"} <span className="pf-req">*</span></label>
              <input className="pf-input" value={form.nameAr} onChange={e => set("nameAr", e.target.value)} required dir="rtl" />
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "العلامة التجارية" : "Brand"} <span className="pf-req">*</span></label>
              <input className="pf-input" value={form.brand} onChange={e => set("brand", e.target.value)} required />
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "القسم" : "Category"} <span className="pf-req">*</span></label>
              <select className="pf-select" value={form.categoryId} onChange={e => set("categoryId", e.target.value)} required>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{isRtl ? c.nameAr : c.name}</option>
                ))}
              </select>
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "التصنيف الفرعي" : "Subcategory"}</label>
              <select className="pf-select" value={form.subcategoryId} onChange={e => set("subcategoryId", e.target.value)}>
                <option value="">{isRtl ? "بدون تصنيف فرعي" : "None"}</option>
                {subcategories.map(sc => (
                  <option key={sc.id} value={sc.id}>{isRtl ? sc.nameAr : sc.name}</option>
                ))}
              </select>
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "النوع" : "Item Type"}</label>
              <select className="pf-select" value={form.itemTypeId} onChange={e => set("itemTypeId", e.target.value)}>
                <option value="">{isRtl ? "بدون نوع" : "None"}</option>
                {itemTypes.map(it => (
                  <option key={it.id} value={it.id}>{isRtl ? it.nameAr : it.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pf-field pf-field-full">
            <label className="pf-label">{isRtl ? "الوصف" : "Description"}</label>
            <textarea className="pf-textarea" value={form.description} onChange={e => set("description", e.target.value)} rows={3} />
          </div>
          <div className="pf-field pf-field-full">
            <label className="pf-label">{isRtl ? "صور المنتج" : "Product Images"}</label>
            <ProductImageUpload value={form.images} onChange={(v) => set("images", v)} locale={locale} />
          </div>
        </div>

        {/* Pricing */}
        <div className="pf-section">
          <h2 className="pf-section-title">{isRtl ? "التسعير" : "Pricing"}</h2>
          <div className="pf-grid-3">
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "سعر التجزئة" : "Retail Price"} <span className="pf-req">*</span></label>
              <div className="pf-input-suffix-wrap">
                <input className="pf-input pf-input-suffix" type="number" step="0.01" min="0" value={form.priceRetail} onChange={e => set("priceRetail", e.target.value)} required />
                <span className="pf-suffix">EGP</span>
              </div>
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "سعر الجملة" : "Wholesale Price"}</label>
              <div className="pf-input-suffix-wrap">
                <input className="pf-input pf-input-suffix" type="number" step="0.01" min="0" value={form.priceWholesale} onChange={e => set("priceWholesale", e.target.value)} />
                <span className="pf-suffix">EGP</span>
              </div>
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "سعر التخفيض" : "Discount Price"}</label>
              <div className="pf-input-suffix-wrap">
                <input className="pf-input pf-input-suffix" type="number" step="0.01" min="0" value={form.discountPrice} onChange={e => set("discountPrice", e.target.value)} />
                <span className="pf-suffix">EGP</span>
              </div>
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "التكلفة" : "Cost"} <span className="pf-req">*</span></label>
              <div className="pf-input-suffix-wrap">
                <input className="pf-input pf-input-suffix" type="number" step="0.01" min="0" value={form.cost} onChange={e => set("cost", e.target.value)} placeholder={isRtl ? "سيتم استخدام سعر التجزئة" : "Defaults to retail price"} />
                <span className="pf-suffix">EGP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory & Flags */}
        <div className="pf-section">
          <h2 className="pf-section-title">{isRtl ? "المخزون والإعدادات" : "Inventory & Settings"}</h2>
          <div className="pf-grid-3">
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "الكمية المتوفرة" : "Stock Quantity"} <span className="pf-req">*</span></label>
              <input className="pf-input" type="number" min="0" value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="0" />
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "الحد الأدنى للطلب" : "Min. Quantity"}</label>
              <input className="pf-input" type="number" min="1" value={form.minQty} onChange={e => set("minQty", e.target.value)} />
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "التقييم" : "Rating"}</label>
              <input className="pf-input" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => set("rating", e.target.value)} />
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "الوسم" : "Badge"}</label>
              <select className="pf-select" value={form.badge} onChange={e => set("badge", e.target.value)}>
                {badgeOptions.map(b => <option key={b.value} value={b.value}>{isRtl ? b.labelAr : b.labelEn}</option>)}
              </select>
            </div>
          </div>

          <div className="pf-toggles">
            {[
              { key: "inStock",   labelEn: "In Stock",   labelAr: "متوفر بالمخزون", color: "#10b981" },
              { key: "isPopular", labelEn: "Popular",    labelAr: "شائع",            color: "#f59e0b" },
              { key: "isBestSale",labelEn: "Best Sale",  labelAr: "الأكثر مبيعاً",  color: "#8b5cf6" },
            ].map(toggle => (
              <label key={toggle.key} className="pf-toggle-label">
                <div
                  className={`pf-toggle ${(form as any)[toggle.key] ? "on" : "off"}`}
                  style={{ "--toggle-color": toggle.color } as any}
                  onClick={() => set(toggle.key, !(form as any)[toggle.key])}
                >
                  <div className="pf-toggle-thumb" />
                </div>
                <span>{isRtl ? toggle.labelAr : toggle.labelEn}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pf-actions">
          <button type="submit" disabled={saving} className="pf-save-btn">
            {saving ? (
              <><div className="pf-btn-spinner" />{isRtl ? "جاري الحفظ..." : "Saving..."}</>
            ) : (
              <><Save className="size-4" />{isRtl ? "حفظ المنتج" : "Save Product"}</>
            )}
          </button>
          <Link href="/admin/products" className="pf-cancel-btn">
            {isRtl ? "إلغاء" : "Cancel"}
          </Link>
        </div>
      </form>

      <style>{`
        ${productFormStyles}
      `}</style>
    </div>
  );
}

export const productFormStyles = `
  .pf-root { display: flex; flex-direction: column; gap: 1.5rem; max-width: 860px; }

  .pf-header { display: flex; flex-direction: column; gap: 1rem; }
  .pf-back {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.83rem; color: var(--muted-foreground);
    text-decoration: none; transition: color 0.2s; width: fit-content;
  }
  .pf-back:hover { color: var(--foreground); }
  .pf-title-row { display: flex; align-items: center; gap: 0.875rem; }
  .pf-title-icon {
    width: 48px; height: 48px; border-radius: 0.875rem;
    background: linear-gradient(135deg, #C0161B, #e83030);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 4px 14px rgba(192,22,27,0.3);
  }
  .pf-title { font-size: 1.5rem; font-weight: 800; }
  .pf-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }

  .pf-error {
    background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.25);
    color: #b91c1c; border-radius: 0.875rem; padding: 0.875rem 1rem;
    font-size: 0.875rem; font-weight: 500;
  }

  .pf-form { display: flex; flex-direction: column; gap: 1.25rem; }
  .pf-section {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 1.25rem; padding: 1.375rem;
    display: flex; flex-direction: column; gap: 1rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  }
  .pf-section-title {
    font-size: 0.875rem; font-weight: 800;
    color: var(--foreground); letter-spacing: -0.01em;
    padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);
    margin-bottom: 0.25rem;
  }

  .pf-grid-2 { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
  .pf-grid-3 { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
  @media (min-width: 560px) {
    .pf-grid-2 { grid-template-columns: 1fr 1fr; }
    .pf-grid-3 { grid-template-columns: 1fr 1fr; }
  }
  @media (min-width: 800px) {
    .pf-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  }
  .pf-field-full { grid-column: 1 / -1; }

  .pf-field { display: flex; flex-direction: column; gap: 0.375rem; }
  .pf-label { font-size: 0.78rem; font-weight: 700; color: var(--foreground); }
  .pf-req { color: #ef4444; }
  .pf-input, .pf-select, .pf-textarea {
    background: var(--background); border: 1.5px solid var(--border);
    border-radius: 0.75rem; padding: 0.6rem 0.875rem;
    font-size: 0.875rem; color: var(--foreground);
    font-family: inherit; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  .pf-input:focus, .pf-select:focus, .pf-textarea:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(192,22,27,0.12);
  }
  .pf-textarea { resize: vertical; min-height: 80px; }

  .pf-input-suffix-wrap { position: relative; }
  .pf-input-suffix { padding-inline-end: 3rem; }
  .pf-suffix {
    position: absolute; inset-block: 0; inset-inline-end: 0;
    display: flex; align-items: center; padding: 0 0.75rem;
    font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground);
    pointer-events: none;
  }

  /* Toggles */
  .pf-toggles { display: flex; gap: 1.5rem; flex-wrap: wrap; padding-top: 0.25rem; }
  .pf-toggle-label { display: flex; align-items: center; gap: 0.625rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; }
  .pf-toggle {
    width: 40px; height: 22px; border-radius: 999px;
    position: relative; cursor: pointer;
    transition: background 0.25s;
  }
  .pf-toggle.on { background: var(--toggle-color, var(--primary)); }
  .pf-toggle.off { background: var(--border); }
  .pf-toggle-thumb {
    position: absolute; top: 3px;
    width: 16px; height: 16px;
    border-radius: 50%; background: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    transition: inset-inline-start 0.25s;
  }
  .pf-toggle.on .pf-toggle-thumb { inset-inline-start: calc(100% - 19px); }
  .pf-toggle.off .pf-toggle-thumb { inset-inline-start: 3px; }

  /* Actions */
  .pf-actions { display: flex; align-items: center; gap: 0.75rem; padding-top: 0.5rem; }
  .pf-save-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: var(--primary); color: #fff;
    padding: 0.7rem 1.5rem; border-radius: 999px;
    font-weight: 800; font-size: 0.875rem;
    border: none; cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;
    box-shadow: 0 4px 14px rgba(192,22,27,0.3);
  }
  .pf-save-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .pf-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .pf-btn-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    animation: pf-spin 0.7s linear infinite;
  }
  @keyframes pf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .pf-cancel-btn {
    display: inline-flex; align-items: center;
    padding: 0.7rem 1.25rem; border-radius: 999px;
    font-weight: 700; font-size: 0.875rem;
    border: 1.5px solid var(--border);
    color: var(--muted-foreground); text-decoration: none;
    transition: all 0.2s; background: var(--card);
  }
  .pf-cancel-btn:hover { border-color: var(--foreground); color: var(--foreground); }
`;
