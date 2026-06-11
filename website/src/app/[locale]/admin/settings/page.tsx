"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Settings, Globe, MapPin, Percent, Save, Loader2, CheckCircle, ExternalLink, Star } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [taxRate, setTaxRate] = useState("15");
  const [shippingFee, setShippingFee] = useState("0");
  const [showRatings, setShowRatings] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.getWebStoreSettings()
      .then((res: any) => {
        if (res) {
          setTaxRate(String(res.taxRate ?? 15));
          setShippingFee(String(res.shippingFee ?? 0));
          setShowRatings(res.showRatings ?? true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await adminApi.updateWebStoreSettings({
        taxRate: Number(taxRate) || 0,
        shippingFee: Number(shippingFee) || 0,
        active: true,
        showRatings,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Globe className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {isRtl ? "إعدادات المتجر الإلكتروني" : "Web Store Settings"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRtl ? "تخصيص الضريبة ورسوم الشحن وعرض التقييمات" : "Configure tax, shipping fees, and ratings display"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isRtl ? "الضرائب والشحن" : "Tax & Shipping"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="taxRate">
                  <Percent className="size-3.5 inline mr-1" />
                  {isRtl ? "نسبة الضريبة (%)" : "Tax Rate (%)"}
                </Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  {isRtl
                    ? "نسبة الضريبة المضافة على المنتجات (مثال: 15)"
                    : "Tax percentage applied to products (e.g. 15)"}
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {isRtl ? "رسوم الشحن حسب المنطقة" : "Shipping fees by zone"}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {isRtl
                        ? "يتم تحديد رسوم الشحن لكل منطقة توصيل بشكل منفصل. قم بإدارة المناطق والرسوم من صفحة"
                        : "Shipping fees are configured per delivery zone. Manage zones and fees from the"}
                      {" "}
                      <Link href="/admin/delivery-zones" className="underline font-medium hover:text-amber-900 inline-flex items-center gap-1">
                        {isRtl ? "مناطق التوصيل" : "Delivery Zones"}
                        <ExternalLink className="size-3" />
                      </Link>
                      {isRtl ? "." : "."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="size-4" />
                {isRtl ? "تقييمات المنتجات" : "Product Ratings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {isRtl ? "عرض التقييمات في الموقع" : "Show ratings on website"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRtl
                      ? "التحكم في إظهار أو إخفاء تقييمات المنتجات في المتجر الإلكتروني"
                      : "Toggle whether product ratings are visible to customers"}
                  </p>
                </div>
                <div dir="ltr">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showRatings}
                    onClick={() => setShowRatings(!showRatings)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      showRatings ? "bg-primary" : "bg-input"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                        showRatings ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full px-8"
            >
              {saving ? (
                <><Loader2 className="size-4 animate-spin" /> {isRtl ? "جاري الحفظ..." : "Saving..."}</>
              ) : (
                <><Save className="size-4" /> {isRtl ? "حفظ الإعدادات" : "Save Settings"}</>
              )}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <CheckCircle className="size-4" />
                {isRtl ? "تم الحفظ" : "Saved"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
