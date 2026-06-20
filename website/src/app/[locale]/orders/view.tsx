"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { Package, Search, Loader2 } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type TrackResult = {
  invoiceNo: string;
  status: string;
  orderStatus?: string;
  total: number;
  createdAt: string;
  customerName: string;
  items: Array<{
    productName: string;
    productNameAr?: string;
    quantity: number;
    lineTotal: number;
  }>;
};

export default function OrdersView() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [invoiceNo, setInvoiceNo] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackResult | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const params = new URLSearchParams({
        invoiceNo: invoiceNo.trim(),
      });
      if (phone.trim()) params.set("phone", phone.trim());
      const res = await fetch(
        `${API_BASE_URL}/store/orders/track?${params.toString()}`,
      );
      const json = await res.json();
      if (!json.success || !json.data) {
        setError(
          isRtl
            ? "لم يتم العثور على الطلب. تحقق من رقم الفاتورة والهاتف."
            : "Order not found. Check invoice number and phone.",
        );
        return;
      }
      setOrder(json.data);
    } catch {
      setError(isRtl ? "حدث خطأ. حاول مرة أخرى." : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <Package className="size-8 text-[#C0161B]" />
          <div>
            <h1 className="text-2xl font-bold">
              {isRtl ? "تتبع الطلب" : "Track Order"}
            </h1>
            <p className="text-sm text-white/60">
              {isRtl
                ? "أدخل رقم الفاتورة ورقم الهاتف"
                : "Enter your invoice number and phone"}
            </p>
          </div>
        </div>

        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/70">
              {isRtl ? "رقم الفاتورة" : "Invoice number"}
            </label>
            <input
              required
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="BR001-20260620-0021"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#C0161B]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">
              {isRtl ? "رقم الهاتف (اختياري)" : "Phone (optional)"}
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#C0161B]"
              dir="ltr"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C0161B] py-3 font-semibold hover:bg-[#a01216] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Search className="size-5" />
            )}
            {isRtl ? "بحث" : "Track"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {order && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">
              {isRtl ? "رقم الفاتورة" : "Invoice"}
            </p>
            <p className="mb-4 text-lg font-bold" dir="ltr">
              {order.invoiceNo}
            </p>
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/60">{isRtl ? "الحالة" : "Status"}</p>
                <p>{order.orderStatus || order.status}</p>
              </div>
              <div>
                <p className="text-white/60">{isRtl ? "الإجمالي" : "Total"}</p>
                <p>{order.total.toLocaleString()} EGP</p>
              </div>
            </div>
            <ul className="space-y-2 border-t border-white/10 pt-4 text-sm">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>
                    {isRtl ? item.productNameAr || item.productName : item.productName}{" "}
                    × {item.quantity}
                  </span>
                  <span>{item.lineTotal.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
