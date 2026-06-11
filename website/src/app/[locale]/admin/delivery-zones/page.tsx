"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, MapPin, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Zone {
  id: number;
  name: string;
  nameAr: string;
  fee: number;
  active: boolean;
  sortOrder: number;
}

const emptyZone = { name: "", nameAr: "", fee: 0, sortOrder: 99 };

export default function AdminDeliveryZonesPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyZone);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = () => {
    setLoading(true);
    fetch(`${API}/store/delivery-zones`, { headers })
      .then((r) => r.json())
      .then((d) => setZones(d.data || []))
      .catch(() => setZones([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => { setEditingId(null); setForm(emptyZone); setError(""); setShowForm(true); };
  const openEdit = (z: Zone) => { setEditingId(z.id); setForm({ name: z.name, nameAr: z.nameAr, fee: z.fee, sortOrder: z.sortOrder }); setError(""); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim() || !form.nameAr.trim()) {
      setError(isRtl ? "الاسم بالعربي والإنجليزي مطلوبان" : "Both Arabic and English names are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `${API}/store/delivery-zones/${editingId}` : `${API}/store/delivery-zones`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(await res.text());
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (z: Zone) => {
    await fetch(`${API}/store/delivery-zones/${z.id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ active: !z.active }),
    });
    setZones((prev) => prev.map((x) => x.id === z.id ? { ...x, active: !x.active } : x));
  };

  const remove = async (id: number, name: string) => {
    if (!confirm(isRtl ? `حذف "${name}"؟` : `Delete "${name}"?`)) return;
    setDeletingId(id);
    await fetch(`${API}/store/delivery-zones/${id}`, { method: "DELETE", headers });
    setZones((prev) => prev.filter((z) => z.id !== id));
    setDeletingId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800 }}>{isRtl ? "مناطق التوصيل" : "Delivery Zones"}</h1>
          <p style={{ fontSize: "0.83rem", color: "var(--muted-foreground)", marginTop: "0.15rem" }}>
            {isRtl ? "إدارة مناطق الشحن ورسوم التوصيل" : "Manage shipping zones and delivery fees"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={load} style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.625rem", border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer" }}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={openNew} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "var(--primary)", color: "#fff", padding: "0.6rem 1.1rem", borderRadius: "999px", fontWeight: 700, fontSize: "0.875rem", border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(192,22,27,0.3)" }}>
            <Plus className="size-4" />
            {isRtl ? "إضافة منطقة" : "Add Zone"}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: "var(--card)", border: "2px solid var(--primary)", borderRadius: "1.25rem", padding: "1.5rem", boxShadow: "0 8px 32px rgba(192,22,27,0.1)" }}>
          <h2 style={{ fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MapPin className="size-5 text-primary" />
            {editingId ? (isRtl ? "تعديل منطقة" : "Edit Zone") : (isRtl ? "إضافة منطقة جديدة" : "Add New Zone")}
          </h2>

          {error && <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "0.75rem", padding: "0.75rem 1rem", color: "#b91c1c", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</div>}

          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                {isRtl ? "الاسم (إنجليزي)" : "Name (English)"} *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Cairo"
                style={{ width: "100%", padding: "0.6rem 0.875rem", border: "1px solid var(--border)", borderRadius: "0.625rem", background: "var(--background)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                {isRtl ? "الاسم (عربي)" : "Name (Arabic)"} *
              </label>
              <input
                value={form.nameAr}
                onChange={(e) => setForm((p) => ({ ...p, nameAr: e.target.value }))}
                placeholder="القاهرة"
                dir="rtl"
                style={{ width: "100%", padding: "0.6rem 0.875rem", border: "1px solid var(--border)", borderRadius: "0.625rem", background: "var(--background)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                {isRtl ? "رسوم التوصيل (ج.م)" : "Delivery Fee (EGP)"}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.fee}
                onChange={(e) => setForm((p) => ({ ...p, fee: Number(e.target.value) }))}
                style={{ width: "100%", padding: "0.6rem 0.875rem", border: "1px solid var(--border)", borderRadius: "0.625rem", background: "var(--background)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
              />
              {form.fee === 0 && <p style={{ fontSize: "0.7rem", color: "#16a34a", marginTop: "0.25rem" }}>{isRtl ? "توصيل مجاني" : "Free delivery"}</p>}
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                {isRtl ? "ترتيب العرض" : "Sort Order"}
              </label>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                style={{ width: "100%", padding: "0.6rem 0.875rem", border: "1px solid var(--border)", borderRadius: "0.625rem", background: "var(--background)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.6rem 1.25rem", borderRadius: "999px", border: "1px solid var(--border)", background: "var(--card)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
              <X className="size-4" /> {isRtl ? "إلغاء" : "Cancel"}
            </button>
            <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.6rem 1.5rem", borderRadius: "999px", background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: "0.875rem", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              <Check className="size-4" /> {saving ? "..." : (isRtl ? "حفظ" : "Save")}
            </button>
          </div>
        </div>
      )}

      {/* Zones Grid */}
      {loading ? (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.25rem", animation: "pulse 1.5s infinite" }}>
              <div style={{ height: 20, background: "var(--muted)", borderRadius: "0.375rem", marginBottom: "0.75rem", width: "60%" }} />
              <div style={{ height: 14, background: "var(--muted)", borderRadius: "0.375rem", width: "40%" }} />
            </div>
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "1.25rem" }}>
          <MapPin style={{ width: 48, height: 48, color: "var(--muted-foreground)", opacity: 0.3, margin: "0 auto 1rem" }} />
          <h3 style={{ fontWeight: 700 }}>{isRtl ? "لا توجد مناطق توصيل" : "No delivery zones"}</h3>
          <p style={{ color: "var(--muted-foreground)", marginTop: "0.5rem" }}>{isRtl ? "أضف أول منطقة توصيل" : "Add your first delivery zone"}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {zones.map((z) => (
            <div key={z.id} style={{ background: "var(--card)", border: `1px solid ${z.active ? "var(--border)" : "rgba(220,38,38,0.2)"}`, borderRadius: "1rem", padding: "1.25rem", transition: "box-shadow 0.2s", position: "relative", opacity: z.active ? 1 : 0.7 }}>
              {/* Fee badge */}
              <div style={{ position: "absolute", top: "1rem", insetInlineEnd: "1rem" }}>
                <span style={{ background: z.fee === 0 ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.1)", color: z.fee === 0 ? "#065f46" : "#1d4ed8", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
                  {z.fee === 0 ? (isRtl ? "مجاني" : "Free") : `${z.fee} ${isRtl ? "ج.م" : "EGP"}`}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: "0.625rem", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MapPin className="size-4 text-primary" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{isRtl ? z.nameAr : z.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{isRtl ? z.name : z.nameAr}</div>
                </div>
              </div>

              {!z.active && (
                <span style={{ display: "inline-block", background: "rgba(220,38,38,0.1)", color: "#b91c1c", fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "999px", marginBottom: "0.75rem" }}>
                  {isRtl ? "معطل" : "Inactive"}
                </span>
              )}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button onClick={() => openEdit(z)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                  <Pencil className="size-3.5" /> {isRtl ? "تعديل" : "Edit"}
                </button>
                <button onClick={() => toggleActive(z)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", background: z.active ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", color: z.active ? "#059669" : "#d97706", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                  {z.active ? <><X className="size-3.5" /> {isRtl ? "إيقاف" : "Disable"}</> : <><Check className="size-3.5" /> {isRtl ? "تفعيل" : "Enable"}</>}
                </button>
                <button onClick={() => remove(z.id, z.name)} disabled={deletingId === z.id} style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", background: "rgba(220,38,38,0.08)", color: "#ef4444", border: "none", cursor: "pointer" }}>
                  {deletingId === z.id ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(220,38,38,0.3)", borderTopColor: "#ef4444", animation: "spin 0.7s linear infinite" }} /> : <Trash2 className="size-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
