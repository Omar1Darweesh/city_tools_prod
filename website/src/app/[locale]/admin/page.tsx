"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import {
  Package, FolderTree, ShoppingCart, TrendingUp,
  Plus, ArrowUpRight, Clock, CheckCircle, XCircle,
  Truck, Star, Flame, DollarSign,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

const statusConfig: Record<string, { colorClass: string; icon: any; labelEn: string; labelAr: string }> = {
  PENDING:   { colorClass: "status-pending",   icon: Clock,        labelEn: "Pending",   labelAr: "قيد الانتظار" },
  CONFIRMED: { colorClass: "status-confirmed", icon: CheckCircle,  labelEn: "Confirmed", labelAr: "مؤكد" },
  SHIPPED:   { colorClass: "status-shipped",   icon: Truck,        labelEn: "Shipped",   labelAr: "تم الشحن" },
  DELIVERED: { colorClass: "status-delivered", icon: CheckCircle,  labelEn: "Delivered", labelAr: "تم التوصيل" },
  CANCELLED: { colorClass: "status-cancelled", icon: XCircle,      labelEn: "Cancelled", labelAr: "ملغي" },
};

export default function AdminDashboard() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [stats, setStats] = useState({ products: 0, categories: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [popularCount, setPopularCount] = useState(0);
  const [bestSellerCount, setBestSellerCount] = useState(0);
  const [discountCards, setDiscountCards] = useState<any[]>([]);
  const [statCounters, setStatCounters] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      adminApi.getProducts("limit=100"),
      adminApi.getCategories(),
      adminApi.getOrders(),
    ]).then(([products, cats, orders]) => {
      const allProducts: any[] = products.data || [];
      const orderList: any[] = orders.data || [];
      const revenue = orderList.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? (o.total || 0) : 0), 0);

      const byStatus: Record<string, number> = {};
      orderList.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

      setStats({ products: products.total || allProducts.length, categories: cats.data?.length || 0, orders: orderList.length, revenue });
      setPopularCount(allProducts.filter(p => p.isPopular).length);
      setBestSellerCount(allProducts.filter(p => p.isBestSale).length);
      setRecentOrders(orderList.slice(0, 6));
      setOrdersByStatus(byStatus);
    }).catch(() => {});

    // Separate calls so they don't block main stats
    adminApi.getDiscountCards().then((res) => {
      setDiscountCards((res.data || []).slice(0, 3));
    }).catch(() => {});
    adminApi.getStatistics().then((res) => {
      setStatCounters((res.data || []).slice(0, 4));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      icon: Package,
      labelEn: "Total Products", labelAr: "إجمالي المنتجات",
      value: loading ? "—" : stats.products,
      href: "/admin/products",
      gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      bgGlow: "rgba(59,130,246,0.12)",
    },
    {
      icon: Star,
      labelEn: "Popular", labelAr: "شائع",
      value: loading ? "—" : popularCount,
      href: "/admin/products",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      bgGlow: "rgba(245,158,11,0.12)",
    },
    {
      icon: Flame,
      labelEn: "Best Sellers", labelAr: "الأكثر مبيعاً",
      value: loading ? "—" : bestSellerCount,
      href: "/admin/products",
      gradient: "linear-gradient(135deg, #ef4444, #b91c1c)",
      bgGlow: "rgba(239,68,68,0.12)",
    },
    {
      icon: FolderTree,
      labelEn: "Categories", labelAr: "الأقسام",
      value: loading ? "—" : stats.categories,
      href: "/admin/categories",
      gradient: "linear-gradient(135deg, #10b981, #065f46)",
      bgGlow: "rgba(16,185,129,0.12)",
    },
    {
      icon: ShoppingCart,
      labelEn: "Total Orders", labelAr: "إجمالي الطلبات",
      value: loading ? "—" : stats.orders,
      href: "/admin/orders",
      gradient: "linear-gradient(135deg, #f59e0b, #b45309)",
      bgGlow: "rgba(245,158,11,0.12)",
    },
    {
      icon: TrendingUp,
      labelEn: "Revenue", labelAr: "الإيرادات",
      value: loading ? "—" : stats.revenue > 0 ? `${stats.revenue.toLocaleString()} EGP` : "—",
      href: "/admin/orders",
      gradient: "linear-gradient(135deg, #C0161B, #e83030)",
      bgGlow: "rgba(192,22,27,0.12)",
    },
  ];

  return (
    <div className="dash-root">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">{isRtl ? "لوحة التحكم" : "Dashboard"}</h1>
          <p className="dash-subtitle">{isRtl ? "مرحباً بك في لوحة إدارة المتجر" : "Welcome to your store control panel"}</p>
        </div>
        <div className="dash-header-actions">
          <Link href="/admin/products/new" className="dash-primary-btn">
            <Plus className="size-4" />
            {isRtl ? "منتج جديد" : "New Product"}
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dash-stats-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link key={i} href={card.href} className="stat-card">
              <div className="stat-card-inner" style={{ background: card.bgGlow }}>
                <div className="stat-icon" style={{ background: card.gradient }}>
                  <Icon className="size-5 text-white" />
                </div>
                <div className="stat-body">
                  <p className="stat-value">{card.value}</p>
                  <p className="stat-label">{isRtl ? card.labelAr : card.labelEn}</p>
                </div>
                <ArrowUpRight className="stat-arrow" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Active Discount Cards */}
      {!loading && (
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h2 className="dash-card-title">{isRtl ? "بطاقات الخصم النشطة" : "Active Discount Cards"}</h2>
              <p className="dash-card-sub">{isRtl ? "العروض الترويجية في الصفحة الرئيسية" : "Promo banners on the homepage"}</p>
            </div>
            <Link href="/admin/discount-cards" className="dash-card-link">
              {isRtl ? "إدارة" : "Manage"}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          {discountCards.length === 0 ? (
            <div className="dash-empty">
              <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد بطاقات خصم نشطة. أضف واحدة من صفحة" : "No active discount cards. Add one from the"} <Link href="/admin/discount-cards/new" className="dash-card-link" style={{ display: "inline" }}>{isRtl ? "بطاقات الخصم" : "Discount Cards"}</Link> {isRtl ? "صفحة" : "page"}</p>
            </div>
          ) : (
            <div className="dc-mini-list">
              {discountCards.map((card) => (
                <div key={card.id} className="dc-mini-card">
                  <span className="dc-mini-badge">✦ {isRtl ? card.badgeAr : card.badgeEn}</span>
                  <h4 className="dc-mini-title">{isRtl ? card.titleAr : card.titleEn}</h4>
                  <p className="dc-mini-desc">{isRtl ? card.descAr : card.descEn}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics Counters */}
      {!loading && (
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h2 className="dash-card-title">{isRtl ? "إحصائيات سريعة" : "Quick Stats"}</h2>
              <p className="dash-card-sub">{isRtl ? "عدادات الإحصائيات في الصفحة الرئيسية" : "Statistics counters on the homepage"}</p>
            </div>
            <Link href="/admin/statistics" className="dash-card-link">
              {isRtl ? "إدارة" : "Manage"}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          {statCounters.length === 0 ? (
            <div className="dash-empty">
              <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد إحصائيات نشطة. أضف واحدة من صفحة" : "No active stats. Add one from the"} <Link href="/admin/statistics/new" className="dash-card-link" style={{ display: "inline" }}>{isRtl ? "الإحصائيات" : "Statistics"}</Link> {isRtl ? "صفحة" : "page"}</p>
            </div>
          ) : (
            <div className="qs-grid">
              {statCounters.map((s) => (
                <div key={s.id} className="qs-item">
                  <p className="qs-value">{s.value}</p>
                  <p className="qs-label">{isRtl ? s.labelAr : s.labelEn}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Two-column layout */}
      <div className="dash-two-col">
        {/* Recent Orders */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h2 className="dash-card-title">{isRtl ? "أحدث الطلبات" : "Recent Orders"}</h2>
              <p className="dash-card-sub">{isRtl ? "آخر 6 طلبات" : "Latest 6 orders"}</p>
            </div>
            <Link href="/admin/orders" className="dash-card-link">
              {isRtl ? "عرض الكل" : "View all"}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="dash-skeleton-list">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="dash-skeleton-row">
                  <div className="dash-skeleton h-9 w-9 rounded-full" />
                  <div style={{ flex: 1 }}>
                    <div className="dash-skeleton h-3 w-24 mb-1.5 rounded" />
                    <div className="dash-skeleton h-3 w-36 rounded" />
                  </div>
                  <div className="dash-skeleton h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="dash-empty">
              <ShoppingCart className="size-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد طلبات بعد" : "No orders yet"}</p>
            </div>
          ) : (
            <div className="dash-orders-list">
              {recentOrders.map((order) => {
                const cfg = statusConfig[order.status] || statusConfig["PENDING"];
                const StatusIcon = cfg.icon;
                return (
                  <div key={order.id} className="dash-order-row">
                    <div className={`dash-order-icon ${cfg.colorClass}`}>
                      <StatusIcon className="size-3.5" />
                    </div>
                    <div className="dash-order-info">
                      <p className="dash-order-id">#{order.id} · {order.customer?.name || (isRtl ? "عميل" : "Customer")}</p>
                      <p className="dash-order-meta">
                        {order.items?.length || 0} {isRtl ? "منتج" : "items"} ·{" "}
                        {new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB")}
                      </p>
                    </div>
                    <div className="dash-order-right">
                      <p className="dash-order-total">{(order.total || 0).toLocaleString()} EGP</p>
                      <span className={`dash-status-pill ${cfg.colorClass}`}>
                        {isRtl ? cfg.labelAr : cfg.labelEn}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions + Order Status Summary */}
        <div className="dash-side-col">
          {/* Quick Actions */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <h2 className="dash-card-title">{isRtl ? "إجراءات سريعة" : "Quick Actions"}</h2>
                <p className="dash-card-sub">{isRtl ? "اختصارات مفيدة" : "Common shortcuts"}</p>
              </div>
            </div>
            <div className="qa-list">
              {[
                { href: "/admin/products/new", icon: Package, labelEn: "Add New Product", labelAr: "إضافة منتج جديد", descEn: "Create product", descAr: "أضف منتجاً جديداً", color: "#3b82f6" },
                { href: "/admin/categories/new", icon: FolderTree, labelEn: "Add Category", labelAr: "إضافة قسم", descEn: "Create category", descAr: "أضف قسماً جديداً", color: "#10b981" },
                { href: "/admin/orders", icon: ShoppingCart, labelEn: "Manage Orders", labelAr: "إدارة الطلبات", descEn: "View and update orders", descAr: "عرض وتحديث الطلبات", color: "#f59e0b" },
                { href: "/admin/products", icon: Package, labelEn: "Products List", labelAr: "قائمة المنتجات", descEn: "Browse all products", descAr: "تصفح جميع المنتجات", color: "#8b5cf6" },
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link key={i} href={action.href} className="qa-item">
                    <div className="qa-icon" style={{ background: `${action.color}18`, color: action.color }}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="qa-label">{isRtl ? action.labelAr : action.labelEn}</p>
                      <p className="qa-desc">{isRtl ? action.descAr : action.descEn}</p>
                    </div>
                    <ArrowUpRight className="qa-arrow" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="dash-card" style={{ marginTop: "1.25rem" }}>
            <div className="dash-card-header">
              <div>
                <h2 className="dash-card-title">{isRtl ? "حالة الطلبات" : "Order Status"}</h2>
                <p className="dash-card-sub">{isRtl ? "توزيع الطلبات حسب الحالة" : "Breakdown by status"}</p>
              </div>
            </div>
            <div className="os-list">
              {Object.entries(statusConfig).map(([key, cfg]) => {
                const count = ordersByStatus[key] || 0;
                const pct = stats.orders > 0 ? Math.round((count / stats.orders) * 100) : 0;
                const Icon = cfg.icon;
                return (
                  <div key={key} className="os-row">
                    <div className={`os-dot ${cfg.colorClass}`}>
                      <Icon className="size-3" />
                    </div>
                    <span className="os-label">{isRtl ? cfg.labelAr : cfg.labelEn}</span>
                    <div className="os-bar-wrap">
                      <div className={`os-bar ${cfg.colorClass}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="os-count">{loading ? "—" : count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dash-root { display: flex; flex-direction: column; gap: 1.75rem; }

        /* Header */
        .dash-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
        }
        .dash-title { font-size: 1.65rem; font-weight: 800; color: var(--foreground); }
        .dash-subtitle { font-size: 0.85rem; color: var(--muted-foreground); margin-top: 0.2rem; }
        .dash-header-actions { display: flex; gap: 0.75rem; align-items: center; }
        .dash-primary-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--primary); color: #fff;
          padding: 0.6rem 1.25rem; border-radius: 999px;
          font-weight: 700; font-size: 0.875rem;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 16px rgba(192,22,27,0.3);
        }
        .dash-primary-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* Stat Cards */
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .dash-stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .dash-stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1280px) {
          .dash-stats-grid { grid-template-columns: repeat(6, 1fr); }
        }
        .stat-card {
          display: block; text-decoration: none;
          border-radius: 1.25rem;
          border: 1px solid var(--border);
          background: var(--card);
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.1);
        }
        .stat-card-inner {
          padding: 1.25rem;
          display: flex; flex-direction: column; gap: 0.75rem;
          position: relative;
        }
        .stat-icon {
          width: 44px; height: 44px;
          border-radius: 0.875rem;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .stat-body { flex: 1; }
        .stat-value { font-size: 1.6rem; font-weight: 800; color: var(--foreground); line-height: 1; }
        .stat-label { font-size: 0.78rem; color: var(--muted-foreground); margin-top: 0.3rem; font-weight: 500; }
        .stat-arrow {
          position: absolute; top: 1rem; inset-inline-end: 1rem;
          size: 1rem; color: var(--muted-foreground); opacity: 0.4;
          width: 16px; height: 16px;
        }

        /* Two col */
        .dash-two-col {
          display: grid; grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 1100px) {
          .dash-two-col { grid-template-columns: 1fr 360px; }
        }
        .dash-side-col { display: flex; flex-direction: column; }

        /* Card */
        .dash-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 1.25rem;
          padding: 1.25rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .dash-card-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .dash-card-title { font-size: 1rem; font-weight: 700; }
        .dash-card-sub { font-size: 0.78rem; color: var(--muted-foreground); margin-top: 0.15rem; }
        .dash-card-link {
          display: inline-flex; align-items: center; gap: 0.25rem;
          font-size: 0.78rem; color: var(--primary); font-weight: 600;
          text-decoration: none; white-space: nowrap;
        }
        .dash-card-link:hover { opacity: 0.8; }

        /* Skeleton */
        .dash-skeleton-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .dash-skeleton-row { display: flex; align-items: center; gap: 0.75rem; }
        .dash-skeleton {
          background: linear-gradient(90deg, var(--muted) 25%, var(--accent) 50%, var(--muted) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 0.375rem;
        }

        /* Orders list */
        .dash-orders-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .dash-order-row {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.6rem 0.5rem;
          border-radius: 0.75rem;
          transition: background 0.2s;
        }
        .dash-order-row:hover { background: var(--muted); }
        .dash-order-icon {
          width: 32px; height: 32px;
          border-radius: 0.625rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dash-order-info { flex: 1; min-width: 0; }
        .dash-order-id { font-size: 0.825rem; font-weight: 600; color: var(--foreground); }
        .dash-order-meta { font-size: 0.72rem; color: var(--muted-foreground); margin-top: 0.1rem; }
        .dash-order-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; }
        .dash-order-total { font-size: 0.825rem; font-weight: 700; color: var(--foreground); white-space: nowrap; }

        /* Status pills */
        .dash-status-pill {
          font-size: 0.65rem; font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* Status color classes */
        .status-pending   { background: rgba(245,158,11,0.15); color: #b45309; }
        .status-confirmed { background: rgba(59,130,246,0.15);  color: #1d4ed8; }
        .status-shipped   { background: rgba(139,92,246,0.15);  color: #6d28d9; }
        .status-delivered { background: rgba(16,185,129,0.15);  color: #065f46; }
        .status-cancelled { background: rgba(220,38,38,0.12);   color: #b91c1c; }

        .dash-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 2.5rem 0; text-align: center;
        }

        /* Quick Actions */
        .qa-list { display: flex; flex-direction: column; gap: 0.4rem; }
        .qa-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.625rem 0.5rem;
          border-radius: 0.75rem;
          text-decoration: none;
          transition: background 0.2s;
        }
        .qa-item:hover { background: var(--muted); }
        .qa-icon {
          width: 36px; height: 36px;
          border-radius: 0.625rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .qa-label { font-size: 0.85rem; font-weight: 600; color: var(--foreground); }
        .qa-desc { font-size: 0.72rem; color: var(--muted-foreground); margin-top: 0.1rem; }
        .qa-arrow { color: var(--muted-foreground); opacity: 0.4; width: 14px; height: 14px; margin-inline-start: auto; }

        /* Order Status Breakdown */
        .os-list { display: flex; flex-direction: column; gap: 0.6rem; }
        .os-row { display: flex; align-items: center; gap: 0.6rem; }
        .os-dot {
          width: 22px; height: 22px;
          border-radius: 0.375rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .os-label { font-size: 0.78rem; color: var(--muted-foreground); width: 80px; flex-shrink: 0; }
        .os-bar-wrap { flex: 1; height: 6px; background: var(--muted); border-radius: 999px; overflow: hidden; }
        .os-bar { height: 100%; border-radius: 999px; transition: width 0.8s ease; min-width: 4px; }
        .os-bar.status-pending   { background: #f59e0b; }
        .os-bar.status-confirmed { background: #3b82f6; }
        .os-bar.status-shipped   { background: #8b5cf6; }
        .os-bar.status-delivered { background: #10b981; }
        .os-bar.status-cancelled { background: #ef4444; }
        .os-count { font-size: 0.78rem; font-weight: 700; color: var(--foreground); width: 24px; text-align: end; }

        /* Discount Cards Mini */
        .dc-mini-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
        .dc-mini-card {
          background: var(--muted); border: 1px solid var(--border);
          border-radius: 0.875rem; padding: 1rem;
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .dc-mini-badge {
          font-size: 0.65rem; font-weight: 800; color: #e83030;
          background: rgba(192,22,27,0.1); padding: 0.2rem 0.5rem;
          border-radius: 999px; width: fit-content;
        }
        .dc-mini-title { font-size: 0.9rem; font-weight: 700; }
        .dc-mini-desc { font-size: 0.78rem; color: var(--muted-foreground); }

        /* Quick Stats */
        .qs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
        .qs-item {
          background: var(--muted); border-radius: 0.75rem;
          padding: 0.75rem; text-align: center;
        }
        .qs-value { font-size: 1.5rem; font-weight: 800; color: var(--foreground); }
        .qs-label { font-size: 0.7rem; color: var(--muted-foreground); margin-top: 0.15rem; font-weight: 600; }
      `}</style>
    </div>
  );
}
