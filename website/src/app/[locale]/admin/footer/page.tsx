"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { FileText, Save, Loader2, CheckCircle, Plus, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SocialLink {
  label: string;
  url: string;
  icon: string;
}

interface WorkingHour {
  dayEn: string;
  dayAr: string;
  hoursEn: string;
  hoursAr: string;
}

interface FooterSettings {
  email: string;
  phone: string;
  addressEn: string;
  addressAr: string;
  socialLinks: SocialLink[];
  workingHours: WorkingHour[];
}

const defaultSettings: FooterSettings = {
  email: "",
  phone: "",
  addressEn: "",
  addressAr: "",
  socialLinks: [],
  workingHours: [],
};

export default function AdminFooterPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi
      .getFooterSettings()
      .then((res: any) => {
        if (res) {
          setSettings({
            email: res.email ?? "",
            phone: res.phone ?? "",
            addressEn: res.addressEn ?? "",
            addressAr: res.addressAr ?? "",
            socialLinks: res.socialLinks ?? [],
            workingHours: res.workingHours ?? [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await adminApi.updateFooterSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const addSocialLink = () =>
    setSettings((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { label: "", url: "", icon: "link" }],
    }));

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) =>
    setSettings((prev) => {
      const links = [...prev.socialLinks];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, socialLinks: links };
    });

  const removeSocialLink = (index: number) =>
    setSettings((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));

  const addWorkingHour = () =>
    setSettings((prev) => ({
      ...prev,
      workingHours: [...prev.workingHours, { dayEn: "", dayAr: "", hoursEn: "", hoursAr: "" }],
    }));

  const updateWorkingHour = (index: number, field: keyof WorkingHour, value: string) =>
    setSettings((prev) => {
      const hours = [...prev.workingHours];
      hours[index] = { ...hours[index], [field]: value };
      return { ...prev, workingHours: hours };
    });

  const removeWorkingHour = (index: number) =>
    setSettings((prev) => ({
      ...prev,
      workingHours: prev.workingHours.filter((_, i) => i !== index),
    }));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {isRtl ? "إعدادات التذييل" : "Footer Settings"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRtl ? "تخصيص معلومات الاتصال وروابط التواصل الاجتماعي وأوقات العمل" : "Configure contact info, social links, and working hours"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isRtl ? "معلومات الاتصال" : "Contact Info"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="addressEn">{isRtl ? "العنوان (إنجليزي)" : "Address (English)"}</Label>
                  <Input
                    id="addressEn"
                    value={settings.addressEn}
                    onChange={(e) => updateField("addressEn", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressAr">{isRtl ? "العنوان (عربي)" : "Address (Arabic)"}</Label>
                  <Input
                    id="addressAr"
                    dir="rtl"
                    value={settings.addressAr}
                    onChange={(e) => updateField("addressAr", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {isRtl ? "روابط التواصل الاجتماعي" : "Social Links"}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addSocialLink}>
                <Plus className="size-3.5" />
                {isRtl ? "إضافة" : "Add"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.socialLinks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "لا توجد روابط. أضف رابطاً جديداً." : "No links yet. Add a new one."}
                </p>
              )}
              {settings.socialLinks.map((link, i) => (
                <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
                  <div className="flex-1 space-y-2 min-w-[140px]">
                    <Label className="text-xs">{isRtl ? "الاسم" : "Label"}</Label>
                    <Input
                      value={link.label}
                      onChange={(e) => updateSocialLink(i, "label", e.target.value)}
                      placeholder={isRtl ? "فيسبوك" : "Facebook"}
                      className="h-10"
                    />
                  </div>
                  <div className="flex-1 space-y-2 min-w-[200px]">
                    <Label className="text-xs">{isRtl ? "الرابط" : "URL"}</Label>
                    <Input
                      value={link.url}
                      onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                      placeholder="https://"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2 min-w-[120px]">
                    <Label className="text-xs">{isRtl ? "الأيقونة" : "Icon"}</Label>
                    <select
                      value={link.icon}
                      onChange={(e) => updateSocialLink(i, "icon", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {["facebook","instagram","youtube","x","tiktok","snapchat","linkedin","whatsapp","link"].map((iconKey) => (
                        <option key={iconKey} value={iconKey}>{iconKey}</option>
                      ))}
                    </select>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-red-500" onClick={() => removeSocialLink(i)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {isRtl ? "أوقات العمل" : "Working Hours"}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addWorkingHour}>
                <Plus className="size-3.5" />
                {isRtl ? "إضافة" : "Add"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.workingHours.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "لا توجد أوقات عمل. أضف وقتاً جديداً." : "No working hours yet. Add a new one."}
                </p>
              )}
              {settings.workingHours.map((wh, i) => (
                <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
                  <div className="space-y-2 min-w-[120px] flex-1">
                    <Label className="text-xs">{isRtl ? "اليوم (إنجليزي)" : "Day (English)"}</Label>
                    <Input
                      value={wh.dayEn}
                      onChange={(e) => updateWorkingHour(i, "dayEn", e.target.value)}
                      placeholder="Sat–Thu"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2 min-w-[120px] flex-1">
                    <Label className="text-xs">{isRtl ? "اليوم (عربي)" : "Day (Arabic)"}</Label>
                    <Input
                      value={wh.dayAr}
                      dir="rtl"
                      onChange={(e) => updateWorkingHour(i, "dayAr", e.target.value)}
                      placeholder="السبت – الخميس"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2 min-w-[130px] flex-1">
                    <Label className="text-xs">{isRtl ? "الوقت (إنجليزي)" : "Hours (English)"}</Label>
                    <Input
                      value={wh.hoursEn}
                      onChange={(e) => updateWorkingHour(i, "hoursEn", e.target.value)}
                      placeholder="9:00 AM – 9:00 PM"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2 min-w-[130px] flex-1">
                    <Label className="text-xs">{isRtl ? "الوقت (عربي)" : "Hours (Arabic)"}</Label>
                    <Input
                      value={wh.hoursAr}
                      dir="rtl"
                      onChange={(e) => updateWorkingHour(i, "hoursAr", e.target.value)}
                      placeholder="9:00 ص – 9:00 م"
                      className="h-10"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-red-500" onClick={() => removeWorkingHour(i)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} className="rounded-full px-8">
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
