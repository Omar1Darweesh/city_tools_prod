"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Save, Package } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { productFormStyles } from "../../new/page";
import ProductImageUpload from "@/components/admin/product-image-upload";

const badgeOptions = [
  { value: "", labelEn: "None", labelAr: "لا يوجد" },
  { value: "SALE", labelEn: "Sale 🔴", labelAr: "تخفيض 🔴" },
  { value: "NEW",  labelEn: "New ✨",  labelAr: "جديد ✨" },
];

export default function EditProductPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isRtl = locale === "ar";

  const initialized = useRef(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "", nameEn: "", nameAr: "", priceRetail: "", priceWholesale: "",
    discountPrice: "", categoryId: "", subcategoryId: "", itemTypeId: "",
    brand: "", description: "",
    rating: "0", inStock: true, badge: "", isPopular: false, isBestSale: false,
    unit: "PCS", minQty: "1", stock: "0", images: "", barcode: "", cost: "",
  });

  useEffect(() => {
    const id = Number(params.id);
    if (!id) { setError("Invalid product ID"); setLoading(false); return; }

    adminApi.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});

    adminApi.getProduct(id)
      .then((res) => {
        const p = res.data || res;
        if (!p || !p.code) {
          setError(isRtl ? "لم يتم العثور على المنتج" : "Product not found");
          return;
        }
        setForm({
          code: p.code || "",
          barcode: p.barcode || "",
          cost: String(p.cost ?? ""),
          nameEn: p.nameEn || "",
          nameAr: p.nameAr || "",
          priceRetail: String(p.priceRetail ?? ""),
          priceWholesale: String(p.priceWholesale ?? ""),
          discountPrice: p.discountPrice ? String(p.discountPrice) : "",
          categoryId: String(p.categoryId ?? ""),
          subcategoryId: String(p.subcategoryId ?? ""),
          itemTypeId: String(p.itemTypeId ?? ""),
          brand: p.brand || "",
          description: p.description || "",
          rating: String(p.rating ?? "0"),
          inStock: p.inStock ?? true,
          badge: p.badge || "",
          isPopular: p.isPopular ?? false,
          isBestSale: p.isBestSale ?? false,
          unit: p.unit || "PCS",
          minQty: String(p.minQty ?? "1"),
          stock: String(p.stock ?? "0"),
          images: Array.isArray(p.images) ? p.images.join("||") : p.images || "",
        });
        if (p.categoryId) {
          adminApi.getSubcategories(p.categoryId).then(res => setSubcategories(res.data || [])).catch(() => {});
          if (p.subcategoryId) {
            adminApi.getItemTypes(p.subcategoryId).then(res => setItemTypes(res.data || [])).catch(() => {});
          }
        }
      })
      .catch((err) => setError(err.message || (isRtl ? "فشل تحميل المنتج" : "Failed to load product")))
      .finally(() => { setLoading(false); initialized.current = true; });
  }, [params.id]);

  useEffect(() => {
    if (!initialized.current) return;
    const cid = form.categoryId;
    setSubcategories([]);
    setForm(f => ({ ...f, subcategoryId: "", itemTypeId: "" }));
    if (!cid) return;
    adminApi.getSubcategories(Number(cid))
      .then(res => setSubcategories(res.data || []))
      .catch(() => {});
  }, [form.categoryId]);

  useEffect(() => {
    if (!initialized.current) return;
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
      const { stock: _stock, inStock: _inStock, ...restForm } = form;
      const payload = {
        ...restForm,
        priceRetail: Number(form.priceRetail),
        priceWholesale: Number(form.priceWholesale) || Number(form.priceRetail),
        cost: form.cost ? Number(form.cost) : Number(form.priceRetail),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        barcode: form.barcode || form.code,
        rating: Number(form.rating),
        categoryId: Number(form.categoryId),
        subcategoryId: form.subcategoryId ? Number(form.subcategoryId) : null,
        itemTypeId: form.itemTypeId ? Number(form.itemTypeId) : null,
        minQty: Number(form.minQty),
        badge: form.badge || null,
        images: form.images ? form.images.split("||").map(s => s.trim()).filter(Boolean) : [],
      };
      await adminApi.updateProduct(Number(params.id), payload);
      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message || (isRtl ? "حدث خطأ ما" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pf-root">
        <div className="pf-loading">
          <div className="pf-loading-spinner" />
          <p>{isRtl ? "جاري تحميل بيانات المنتج..." : "Loading product data..."}</p>
        </div>
        <style>{productFormStyles}</style>
        <style>{`.pf-loading { display: flex; align-items: center; gap: 1rem; padding: 3rem; color: var(--muted-foreground); } .pf-loading-spinner { width: 24px; height: 24px; border-radius: 50%; border: 3px solid var(--border); border-top-color: var(--primary); animation: pf-spin 0.8s linear infinite; }`}</style>
      </div>
    );
  }

  return (
    <div className="pf-root">
      {/* Header */}
      <div className="pf-header">
        <Link href="/admin/products" className="pf-back">
          <ArrowLeft className="size-4" />
          {isRtl ? "العودة للمنتجات" : "Back to Products"}
        </Link>
        <div className="pf-title-row">
          <div className="pf-title-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
            <Package className="size-5 text-white" />
          </div>
          <div>
            <h1 className="pf-title">{isRtl ? "تعديل المنتج" : "Edit Product"}</h1>
            <p className="pf-sub">{form.nameEn} {form.code ? `· ${form.code}` : ""}</p>
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
              <input className="pf-input" value={form.code} onChange={e => set("code", e.target.value)} required />
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "الباركود" : "Barcode"} <span className="pf-req">*</span></label>
              <input className="pf-input" value={form.barcode} onChange={e => set("barcode", e.target.value)} placeholder={isRtl ? "سيتم استخدام الكود إن لم يدخل" : "Defaults to code if empty"} />
            </div>
            <div className="pf-field">
              <label className="pf-label">{isRtl ? "وحدة القياس" : "Unit"}</label>
              <input className="pf-input" value={form.unit} onChange={e => set("unit", e.target.value)} />
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
              <input className="pf-input" type="number" min="0" value={form.stock} onChange={e => set("stock", e.target.value)} />
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
              { key: "inStock",   labelEn: "In Stock",  labelAr: "متوفر بالمخزون", color: "#10b981" },
              { key: "isPopular", labelEn: "Popular",   labelAr: "شائع",            color: "#f59e0b" },
              { key: "isBestSale",labelEn: "Best Sale", labelAr: "الأكثر مبيعاً",  color: "#8b5cf6" },
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
              <><Save className="size-4" />{isRtl ? "تحديث المنتج" : "Update Product"}</>
            )}
          </button>
          <Link href="/admin/products" className="pf-cancel-btn">
            {isRtl ? "إلغاء" : "Cancel"}
          </Link>
        </div>
      </form>

      <style>{productFormStyles}</style>
    </div>
  );
}
