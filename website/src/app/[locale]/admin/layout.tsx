"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import Image from "next/image";
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart,
  LogOut, Store, Menu, X, ChevronRight, Bell, Settings, Loader2,
  Award, BarChart3, Percent, MapPin, UserCog, Shield, Image as ImageIcon, FileText, HelpCircle,
  Layers, List,
} from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "لوحة التحكم", exact: true },
  { href: "/admin/products", icon: Package, labelEn: "Products", labelAr: "المنتجات", exact: false },
  { href: "/admin/categories", icon: FolderTree, labelEn: "Categories", labelAr: "الأقسام", exact: false },
  { href: "/admin/subcategories", icon: Layers, labelEn: "Subcategories", labelAr: "التصنيفات الفرعية", exact: false },
  { href: "/admin/item-types", icon: List, labelEn: "Item Types", labelAr: "الأنواع", exact: false },
  { href: "/admin/brands", icon: Award, labelEn: "Brands", labelAr: "الماركات", exact: false },
  { href: "/admin/statistics", icon: BarChart3, labelEn: "Statistics", labelAr: "الإحصائيات", exact: false },
  { href: "/admin/discount-cards", icon: Percent, labelEn: "Discount Cards", labelAr: "بطاقات الخصم", exact: false },
  { href: "/admin/trust-features", icon: Shield, labelEn: "Trust Features", labelAr: "مميزات الموقع", exact: false },
  { href: "/admin/support", icon: HelpCircle, labelEn: "Support Pages", labelAr: "صفحات الدعم", exact: false },
  { href: "/admin/footer", icon: FileText, labelEn: "Footer", labelAr: "التذييل", exact: false },
  { href: "/admin/hero-slides", icon: ImageIcon, labelEn: "Hero Slides", labelAr: "شرائح الهيرو", exact: false },
  { href: "/admin/orders", icon: ShoppingCart, labelEn: "Orders", labelAr: "الطلبات", exact: false },
  { href: "/admin/delivery-zones", icon: MapPin, labelEn: "Delivery Zones", labelAr: "مناطق التوصيل", exact: false },
  { href: "/admin/users", icon: UserCog, labelEn: "Admin Users", labelAr: "المستخدمين", exact: false },
  { href: "/admin/settings", icon: Settings, labelEn: "Settings", labelAr: "الإعدادات", exact: false },
];

function SidebarInner({ isRtl, pathname, onNavClick, onLogout }: { isRtl: boolean; pathname: string; onNavClick: () => void; onLogout: () => void }) {
  return (
    <>
        <div className="admin-sidebar-logo">
          <div className="admin-logo-icon">
            <Image src="/assets/CT Logo.png" alt="City Tools" width={22} height={22} className="object-contain brightness-0 invert" loading="eager" />
          </div>
          <div>
            <p className="admin-logo-title">{isRtl ? "سيتي تولز" : "City Tools"}</p>
            <p className="admin-logo-sub">{isRtl ? "لوحة التحكم" : "Admin Panel"}</p>
          </div>
        </div>

      <nav className="admin-nav">
        <p className="admin-nav-group-label">{isRtl ? "القائمة الرئيسية" : "Main Menu"}</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && (item.href !== "/admin" || pathname === "/admin");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`admin-nav-item ${isActive ? "active" : ""}`}
            >
              <div className={`admin-nav-icon-wrap ${isActive ? "active" : ""}`}>
                <Icon className="size-4" />
              </div>
              <span>{isRtl ? item.labelAr : item.labelEn}</span>
              {isActive && <ChevronRight className="size-3.5 ms-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        <Link href="/" onClick={onNavClick} className="admin-bottom-link">
          <Store className="size-4" />
          {isRtl ? "عرض المتجر" : "View Store"}
        </Link>
        <button onClick={onLogout} className="admin-bottom-link danger">
          <LogOut className="size-4" />
          {isRtl ? "تسجيل الخروج" : "Logout"}
        </button>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname();
  const { isLoggedIn, logout } = useSession();
  const router = useRouter();
  const isRtl = locale === "ar";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex,nofollow");
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-card">
          <div className="admin-gate-icon">
            <Settings className="size-8 text-primary" />
          </div>
          <h2 className="admin-gate-title">{isRtl ? "تسجيل الدخول مطلوب" : "Login Required"}</h2>
          <p className="admin-gate-desc">
            {isRtl ? "يجب تسجيل الدخول للوصول إلى لوحة التحكم" : "You must be logged in to access the admin panel"}
          </p>
          <Link href="/auth/login" className="admin-gate-btn">
            {isRtl ? "تسجيل الدخول" : "Sign In"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell" dir={isRtl ? "rtl" : "ltr"}>
      {/* Desktop Sidebar */}
      <aside className="admin-sidebar">
        <SidebarInner isRtl={isRtl} pathname={pathname} onNavClick={() => setMobileOpen(false)} onLogout={() => { logout(); router.push("/"); }} />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="admin-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`admin-sidebar mobile ${mobileOpen ? "open" : ""}`}>
        <button className="admin-mobile-close" onClick={() => setMobileOpen(false)}>
          <X className="size-5" />
        </button>
        <SidebarInner isRtl={isRtl} pathname={pathname} onNavClick={() => setMobileOpen(false)} onLogout={() => { logout(); router.push("/"); }} />
      </aside>

      {/* Main */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <button className="admin-mobile-menu-btn" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </button>
          <div className="admin-topbar-breadcrumb">
            {(() => {
              const active = navItems.find(n =>
                n.exact
                  ? pathname === n.href
                  : pathname.startsWith(n.href) && (n.href !== "/admin" || pathname === "/admin")
              );
              return (
                <span className="text-sm font-semibold text-foreground">
                  {active ? (isRtl ? active.labelAr : active.labelEn) : (isRtl ? "لوحة التحكم" : "Dashboard")}
                </span>
              );
            })()}
          </div>
          <div className="admin-topbar-actions">
            <button className="admin-topbar-icon-btn">
              <Bell className="size-4" />
            </button>
            <div className="admin-topbar-avatar">
              <Store className="size-4 text-primary" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>

      <style>{`
        .admin-shell {
          display: flex;
          min-height: 100vh;
          background: var(--background);
        }

        /* ===== GATE ===== */
        .admin-gate {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          padding: 2rem;
        }
        .admin-gate-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 1.5rem;
          padding: 3rem 2.5rem;
          text-align: center;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
        }
        .admin-gate-icon {
          width: 72px; height: 72px;
          background: var(--accent);
          border-radius: 1.25rem;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .admin-gate-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; }
        .admin-gate-desc { color: var(--muted-foreground); font-size: 0.9rem; margin-bottom: 2rem; }
        .admin-gate-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: var(--primary); color: #fff;
          padding: 0.75rem 2rem; border-radius: 999px;
          font-weight: 700; font-size: 0.9rem;
          transition: opacity 0.2s;
        }
        .admin-gate-btn:hover { opacity: 0.9; }

        /* ===== SIDEBAR ===== */
        .admin-sidebar {
          width: 260px;
          min-height: 100vh;
          background: var(--card);
          border-inline-end: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1rem;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          flex-shrink: 0;
          z-index: 40;
        }
        .admin-sidebar.mobile {
          position: fixed;
          inset-block: 0;
          inset-inline-start: -280px;
          transition: inset-inline-start 0.3s ease;
          box-shadow: 4px 0 30px rgba(0,0,0,0.15);
        }
        .admin-sidebar.mobile.open {
          inset-inline-start: 0;
        }
        @media (min-width: 1024px) {
          .admin-sidebar { display: flex !important; }
          .admin-sidebar.mobile { display: none !important; }
        }
        @media (max-width: 1023px) {
          .admin-sidebar:not(.mobile) { display: none !important; }
        }

        .admin-mobile-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 39;
          backdrop-filter: blur(2px);
        }
        .admin-mobile-close {
          position: absolute; top: 1rem; inset-inline-end: 1rem;
          width: 2rem; height: 2rem;
          display: flex; align-items: center; justify-content: center;
          border-radius: 0.5rem;
          color: var(--muted-foreground);
          transition: background 0.2s;
        }
        .admin-mobile-close:hover { background: var(--muted); }

        /* Sidebar logo */
        .admin-sidebar-logo {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.5rem 0.75rem 1.5rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 1.25rem;
        }
        .admin-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #C0161B, #e83030);
          border-radius: 0.75rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .admin-logo-title { font-weight: 800; font-size: 0.95rem; line-height: 1.2; }
        .admin-logo-sub { font-size: 0.7rem; color: var(--muted-foreground); }

        /* Nav */
        .admin-nav { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
        .admin-nav-group-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--muted-foreground);
          text-transform: uppercase;
          padding: 0 0.75rem;
          margin-bottom: 0.5rem;
        }
        .admin-nav-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.65rem 0.75rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--muted-foreground);
          transition: all 0.2s;
          text-decoration: none;
        }
        .admin-nav-item:hover {
          background: var(--muted);
          color: var(--foreground);
        }
        .admin-nav-item.active {
          background: linear-gradient(135deg, rgba(192,22,27,0.12), rgba(192,22,27,0.06));
          color: var(--primary);
          font-weight: 600;
        }
        .admin-nav-icon-wrap {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 0.5rem;
          background: var(--muted);
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .admin-nav-icon-wrap.active {
          background: var(--primary);
          color: white;
        }

        /* Bottom */
        .admin-sidebar-bottom {
          border-top: 1px solid var(--border);
          padding-top: 1rem;
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .admin-bottom-link {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--muted-foreground);
          transition: all 0.2s;
          text-decoration: none;
          background: none; border: none; cursor: pointer; width: 100%; text-align: start;
        }
        .admin-bottom-link:hover { background: var(--muted); color: var(--foreground); }
        .admin-bottom-link.danger:hover { background: rgba(220,38,38,0.08); color: #dc2626; }

        /* ===== MAIN ===== */
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* Top bar */
        .admin-topbar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background: var(--card);
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .admin-mobile-menu-btn {
          display: none;
          align-items: center; justify-content: center;
          width: 36px; height: 36px;
          border-radius: 0.625rem;
          background: var(--muted);
          color: var(--foreground);
          border: none; cursor: pointer;
          transition: background 0.2s;
        }
        .admin-mobile-menu-btn:hover { background: var(--border); }
        @media (max-width: 1023px) {
          .admin-mobile-menu-btn { display: flex; }
        }
        .admin-topbar-breadcrumb { flex: 1; }
        .admin-topbar-actions {
          display: flex; align-items: center; gap: 0.5rem;
        }
        .admin-topbar-icon-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 0.625rem;
          background: var(--muted);
          color: var(--muted-foreground);
          border: none; cursor: pointer;
          transition: background 0.2s;
        }
        .admin-topbar-icon-btn:hover { background: var(--border); color: var(--foreground); }
        .admin-topbar-avatar {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 0.625rem;
          background: var(--accent);
          border: 2px solid var(--border);
        }

        /* Content */
        .admin-content {
          flex: 1;
          padding: 1.75rem 1.5rem;
          overflow-x: hidden;
        }
        @media (min-width: 1024px) {
          .admin-content { padding: 2rem 2.5rem; }
        }
      `}</style>
    </div>
  );
}
