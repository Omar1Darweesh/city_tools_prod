"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Shield, BadgePercent, HeadphonesIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const { login } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/store/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Invalid credentials");
      }
      const json = await res.json();
      const { token, customer: raw } = json.data;
      const customer = { id: raw.id, name: raw.fullName || raw.username, phone: raw.phone || '' };
      login(token, customer);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Shield, title: locale === "ar" ? "دخول آمن" : "Secure Login", desc: locale === "ar" ? "تشفير بمستوى البنوك" : "Bank-level encryption" },
    { icon: BadgePercent, title: locale === "ar" ? "أفضل الأسعار" : "Best Prices", desc: locale === "ar" ? "عروض حصرية للأعضاء" : "Exclusive member deals" },
    { icon: HeadphonesIcon, title: locale === "ar" ? "دعم على مدار الساعة" : "24/7 Support", desc: locale === "ar" ? "دائماً هنا لمساعدتك" : "Always here to help" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Left panel - Benefits */}
      <div className="hidden w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 lg:flex lg:flex-col lg:justify-center">
        <div className="mx-auto max-w-sm">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20 mb-8">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="size-7">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">
            {locale === "ar" ? "مرحباً بك مرة أخرى" : "Welcome Back"}
          </h2>
          <p className="mt-3 text-white/80">
            {locale === "ar"
              ? "سجل الدخول لمتابعة رحلة التسوق"
              : "Sign in to continue your shopping journey"}
          </p>

          <div className="mt-12 space-y-6">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <b.icon className="size-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{b.title}</p>
                  <p className="text-sm text-white/70">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 lg:hidden mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6 text-primary">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">{t("login")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === "ar" ? "مرحباً بك مرة أخرى" : "Welcome back"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
                {locale === "ar" ? "بيانات الدخول غير صحيحة" : error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{locale === "ar" ? "اسم المستخدم" : "Username"}</Label>
              <Input id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={locale === "ar" ? "أدخل اسم المستخدم" : "Enter username"} className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full h-11 text-base" size="lg">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              {loading ? (locale === "ar" ? "جاري تسجيل الدخول..." : "Signing in...") : t("login")}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {locale === "ar" ? "باستمرارك، أنت توافق على" : "By continuing, you agree to our"}{" "}
            <a href="#" className="text-primary hover:underline">
              {locale === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
            </a>
          </p>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {locale === "ar" ? "هذه الصفحة مخصصة للمديرين فقط" : "This page is for administrators only"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
