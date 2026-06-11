"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { SearchBar } from "@/components/layout/search-bar";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import dynamic from "next/dynamic";
import { CartIcon } from "@/components/layout/cart-icon";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Zap, Wrench, Shield, Droplets, Factory, LayoutGrid, Bolt, Package, Settings, Toolbox, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { store } from "@/data";
import type { MockCategory } from "@/data";
import Image from "next/image";

const AuthSection = dynamic(() => import("@/components/layout/auth-section").then((m) => ({ default: m.AuthSection })), {
  ssr: false,
  loading: () => <div className="flex items-center gap-2" style={{ width: 100 }} />,
});


const ICON_COMPONENT: Record<string, React.ReactNode> = {
  Zap: <Zap className="size-3.5" />,
  Wrench: <Wrench className="size-3.5" />,
  Bolt: <Bolt className="size-3.5" />,
  Droplets: <Droplets className="size-3.5" />,
  Shield: <Shield className="size-3.5" />,
  Factory: <Factory className="size-3.5" />,
  Package: <Package className="size-3.5" />,
  Settings: <Settings className="size-3.5" />,
  Toolbox: <Toolbox className="size-3.5" />,
  Star: <Star className="size-3.5" />,
};

function getCatIcon(icon: string): React.ReactNode {
  const key = icon ? icon.charAt(0).toUpperCase() + icon.slice(1) : "";
  return ICON_COMPONENT[key] || <Package className="size-3.5" />;
}

export function Header() {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const [cats, setCats] = useState<MockCategory[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isRtl = locale === "ar";

  useEffect(() => { store.getCategories().then(setCats); }, []);

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm" dir={isRtl ? "rtl" : "ltr"}>
      {/* Top bar */}
      <div className="bg-white border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRtl ? "right" : "left"} className="w-72 p-6">
              <div className="flex flex-col gap-5">
                <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity" onClick={() => setMobileOpen(false)}>
                  <Image
                    src="/assets/CT Logo.jpg.jpeg"
                    alt="City Tools Logo"
                    width={120}
                    height={48}
                    className="object-contain"
                    priority
                  />
                </Link>
                <div className="h-px bg-border" />
                <nav className="flex flex-col gap-1">
                  {[{ href: "/", key: "home" }, { href: "/products", key: "products" }, { href: "/categories", key: "categories" }, { href: "/brands", key: "brands" }].map((link) => (
                    <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>
                      {t(link.key)}
                    </Link>
                  ))}
                </nav>
                <div className="h-px bg-border" />
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{isRtl ? "الأقسام" : "Categories"}</div>
                {cats.map((cat) => (
                  <Link key={cat.id} href={`/categories/${cat.slug}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors" onClick={() => setMobileOpen(false)}>
                    {getCatIcon(cat.icon)}
                    {isRtl ? cat.nameAr : cat.name}
                  </Link>
                ))}
                <div className="h-px bg-border" />
                <AuthSection />
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo + Shop name */}
          <Link href="/" className="flex items-center gap-3 shrink-0 hover:opacity-75 transition-opacity">
            <Image
              src="/assets/CT Logo.jpg.jpeg"
              alt="City Tools"
              width={140}
              height={56}
              className="object-contain h-12 w-auto"
              priority
            />
            <div className="hidden sm:block border-s border-border ps-3">
              <div className="text-sm font-bold leading-tight">{isRtl ? "سيتي تولز" : "City Tools"}</div>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <SearchBar />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <div className="hidden lg:flex">
              <AuthSection />
            </div>
            <CartIcon />
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <div
        className="hidden lg:block border-b"
        style={{ background: "#1a1a1a" }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6 lg:px-8 py-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <Link
            href="/categories"
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all hover:scale-105 hover:text-[#C0161B] hover:bg-[#111111]"
            style={{ color: "#C0161B", background: "rgba(192,22,27,0.12)" }}
          >
            <LayoutGrid className="size-4" />
            {isRtl ? "جميع الأقسام" : "All Categories"}
          </Link>
          <div className="w-px h-5 mx-1 shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />
          {cats.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white/75 transition-all hover:text-[#C0161B] hover:bg-[#111111] whitespace-nowrap"
            >
               {getCatIcon(cat.icon)}
              {isRtl ? cat.nameAr : cat.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}


