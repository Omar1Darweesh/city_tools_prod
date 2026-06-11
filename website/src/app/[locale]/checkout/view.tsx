"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/components/cart/cart-context";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckCircle, ShoppingCart, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface DeliveryZone {
  id: number;
  name: string;
  nameAr: string;
  fee: number;
  active: boolean;
}

const paymentMethods = [
  { value: "CASH", labelKey: "cash" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const { items, subtotal, itemCount, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [orderRef, setOrderRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<{ taxRate: number; shippingFee: number } | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch(`${API_BASE}/settings/platforms/ONLINE_STORE`)
      .then((r) => r.json().catch(() => null))
      .then((res) => {
        if (res) setSettings({ taxRate: Number(res.taxRate) || 15, shippingFee: Number(res.shippingFee) || 0 });
        else setSettings({ taxRate: 15, shippingFee: 0 });
      })
      .catch(() => setSettings({ taxRate: 15, shippingFee: 0 }));

    fetch(`${API_BASE}/store/delivery-zones?activeOnly=true`)
      .then((r) => r.json())
      .then((res) => {
        const zoneList: DeliveryZone[] = res?.data || [];
        setZones(zoneList);
      })
      .catch(() => {});
  }, []);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const zoneFee = selectedZone?.fee ?? null;
  const shippingCost = zoneFee !== null ? zoneFee : (settings ? settings.shippingFee : 0);
  const taxRate = settings?.taxRate ?? 15;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax + shippingCost;

  if (!mounted) {
    return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"><div className="animate-pulse h-8 w-48 bg-muted rounded mb-8" /></div>;
  }

  if (items.length === 0 && !submitted) {
    return (
      <EmptyState
        icon={<ShoppingCart className="size-16" />}
        title={locale === "ar" ? "سلتك فارغة" : "Your cart is empty"}
        description={locale === "ar" ? "أضف منتجات إلى سلتك قبل إتمام الطلب" : "Add items to your cart before checkout"}
        actionLabel={locale === "ar" ? "تسوق الآن" : "Shop Now"}
        actionHref="/products"
      />
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle className="mx-auto size-16 text-emerald-500" />
        <h1 className="mt-6 text-2xl font-bold">{t("orderSuccess")}</h1>
        <p className="mt-2 text-muted-foreground">{t("orderSuccessDesc")}</p>
        {orderRef && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2">
            <span className="text-sm text-muted-foreground">{locale === "ar" ? "رقم الطلب" : "Order Ref"}:</span>
            <span className="text-lg font-bold tracking-wider">{orderRef}</span>
          </div>
        )}
        <Button className="mt-8 rounded-full" asChild>
          <Link href="/products">{locale === "ar" ? "مواصلة التسوق" : "Continue Shopping"}</Link>
        </Button>
      </div>
    );
  }

  const placeOrder = async () => {
    if (!name.trim() || !phone.trim() || !city.trim() || !address.trim()) {
      setError(locale === "ar" ? "يرجى إدخال الاسم ورقم الهاتف والمدينة والعنوان" : "Please enter name, phone, city and address");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const orderRes = await api.createOrder({
        customerName: name,
        customerPhone: phone,
        shippingAddress: address,
        city,
        paymentMethod,
        notes,
        deliveryZoneId: selectedZoneId ?? undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          qty: item.quantity,
          unitPrice: item.product.price,
        })),
      });
      setOrderRef(orderRes.data?.invoiceNo || (orderRes.data?.id ? `ORD-${String(orderRes.data.id).padStart(5, "0")}` : ""));
      clearCart();
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || (locale === "ar" ? "حدث خطأ أثناء إنشاء الطلب" : "Failed to create order"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("shippingInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("fullName")}</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={locale === "ar" ? "أحمد محمد" : "Ahmed Mohammed"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XXX" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t("city")}</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={locale === "ar" ? "الرياض" : "Riyadh"} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryZone">{locale === "ar" ? "منطقة التوصيل" : "Delivery Zone"}</Label>
                  <select
                    id="deliveryZone"
                    value={selectedZoneId ?? ""}
                    onChange={(e) => setSelectedZoneId(e.target.value ? Number(e.target.value) : null)}
                    style={{
                      width: "100%", padding: "0.6rem 0.875rem",
                      border: "1px solid var(--border)", borderRadius: "0.625rem",
                      background: "var(--background)", fontSize: "0.875rem",
                      outline: "none", boxSizing: "border-box",
                    }}
                  >
                    <option value="">{locale === "ar" ? "-- اختر المنطقة --" : "-- Select zone --"}</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {locale === "ar" ? z.nameAr : z.name} {z.fee === 0 ? (locale === "ar" ? "(مجاني)" : "(Free)") : `(${z.fee} EGP)`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("address")}</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={locale === "ar" ? "الشارع، المبنى، رقم الشقة" : "Street, building, apartment"} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t("notes")}</Label>
                  <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={locale === "ar" ? "ملاحظات إضافية" : "Optional delivery notes"} />
                </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>{t("paymentMethod")}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                {paymentMethods.map((method) => (
                  <div key={method.value} className="mb-3 flex items-center gap-2">
                    <RadioGroupItem value={method.value} id={method.value} />
                    <Label htmlFor={method.value} className="cursor-pointer">
                      {t(method.labelKey)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">
                {locale === "ar" ? "ملخص الطلب" : "Order Summary"}
              </h2>
              <div className="space-y-3 text-sm">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span className="text-muted-foreground truncate max-w-[200px]">
                      {locale === "ar" ? item.product.nameAr : item.product.nameEn} x{item.quantity}
                    </span>
                    <span>{item.product.price * item.quantity} {locale === "ar" ? "ج.م" : "EGP"}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {locale === "ar" ? "المجموع الفرعي" : "Subtotal"} ({itemCount} {locale === "ar" ? "قطعة" : "items"})
                  </span>
                  <span>{subtotal.toFixed(2)} {locale === "ar" ? "ج.م" : "EGP"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{locale === "ar" ? "الشحن" : "Shipping"}</span>
                  <span className={selectedZone && shippingCost === 0 ? "text-green-600" : ""}>{shippingCost > 0 ? `${shippingCost.toFixed(2)} ${locale === "ar" ? "ج.م" : "EGP"}` : (selectedZone ? (locale === "ar" ? "مجاني" : "Free") : `0.00 ${locale === "ar" ? "ج.م" : "EGP"}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{locale === "ar" ? "الضريبة" : "Tax"} ({taxRate}%)</span>
                  <span>{tax.toFixed(2)} {locale === "ar" ? "ج.م" : "EGP"}</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-lg font-bold">
                <span>{locale === "ar" ? "الإجمالي" : "Total"}</span>
                <span>{total.toFixed(2)} {locale === "ar" ? "ج.م" : "EGP"}</span>
              </div>
              <Button
                className="mt-6 w-full rounded-full"
                size="lg"
                disabled={submitting}
                onClick={placeOrder}
              >
                {submitting ? (
                  <><Loader2 className="size-4 animate-spin" /> {locale === "ar" ? "جاري الإرسال..." : "Placing order..."}</>
                ) : (
                  t("placeOrder")
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
