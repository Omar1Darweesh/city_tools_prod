"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import {
  ShoppingCart, ChevronDown, ChevronUp, Clock, CheckCircle,
  XCircle, Truck, Package, User, Phone, Mail, FileText,
  RefreshCw, TrendingUp, Filter, Globe, Store, Search,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

const STATUS_CONFIG: Record<string, {
  labelEn: string; labelAr: string;
  pillClass: string; iconClass: string;
  icon: any; dotColor: string;
  nextEn: string[]; nextAr: string[];
  nextValues: string[];
}> = {
  PENDING:   {
    labelEn: "Pending",   labelAr: "قيد الانتظار",
    pillClass: "pill-pending",   iconClass: "icon-pending",   icon: Clock,
    dotColor: "#f59e0b",
    nextEn: ["Confirm", "Cancel"], nextAr: ["تأكيد", "إلغاء"], nextValues: ["confirmed", "cancelled"],
  },
  CONFIRMED: {
    labelEn: "Confirmed", labelAr: "مؤكد",
    pillClass: "pill-confirmed", iconClass: "icon-confirmed", icon: CheckCircle,
    dotColor: "#3b82f6",
    nextEn: ["Ship", "Cancel"], nextAr: ["شحن", "إلغاء"], nextValues: ["shipped", "cancelled"],
  },
  SHIPPED:   {
    labelEn: "Shipped",   labelAr: "تم الشحن",
    pillClass: "pill-shipped",   iconClass: "icon-shipped",   icon: Truck,
    dotColor: "#8b5cf6",
    nextEn: ["Deliver", "Cancel"], nextAr: ["توصيل", "إلغاء"], nextValues: ["delivered", "cancelled"],
  },
  DELIVERED: {
    labelEn: "Delivered", labelAr: "تم التوصيل",
    pillClass: "pill-delivered", iconClass: "icon-delivered", icon: CheckCircle,
    dotColor: "#10b981",
    nextEn: [], nextAr: [], nextValues: [],
  },
  CANCELLED: {
    labelEn: "Cancelled", labelAr: "ملغي",
    pillClass: "pill-cancelled", iconClass: "icon-cancelled", icon: XCircle,
    dotColor: "#ef4444",
    nextEn: [], nextAr: [], nextValues: [],
  },
};

type FilterStatus = "ALL" | keyof typeof STATUS_CONFIG;

export default function AdminOrdersPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.getOrders()
      .then((res) => {
        const mapped = (res.data || []).map((o: any) => ({
          ...o,
          status: o.status || (o.delivered ? "DELIVERED" : "PENDING"),
        }));
        setOrders(mapped);
      })
      .catch((err) => console.error("Failed to load orders:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await adminApi.updateOrderStatus(id, status);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? (o.total || 0) : 0), 0);
  const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = orders.filter((o) => {
    const statusMatch = filterStatus === "ALL" || o.status === filterStatus;
    const searchMatch = !searchQuery || (o.invoiceNo && o.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()));
    return statusMatch && searchMatch;
  });

  return (
    <div className="ao-root">
      {/* Header */}
      <div className="ao-header">
        <div>
          <h1 className="ao-title">{isRtl ? "الطلبات" : "Orders"}</h1>
          <p className="ao-sub">
            {loading ? "..." : `${orders.length} ${isRtl ? "طلب" : "orders"} · ${isRtl ? "إجمالي المبيعات" : "Revenue"}: ${totalRevenue.toLocaleString()} EGP`}
          </p>
        </div>
        <button onClick={load} className="ao-refresh-btn" title="Refresh">
          <RefreshCw className={`size-4 ${loading ? "ao-spinning" : ""}`} />
        </button>
      </div>

      {/* Search */}
      <div className="ao-search-bar">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isRtl ? "ابحث برقم الفاتورة..." : "Search by invoice..."}
          className="ao-search-input"
        />
      </div>

      {/* Revenue Bar */}
      <div className="ao-revenue-bar">
        <div className="ao-rev-item">
          <TrendingUp className="size-4 text-primary" />
          <div>
            <p className="ao-rev-value">{totalRevenue.toLocaleString()} EGP</p>
            <p className="ao-rev-label">{isRtl ? "إجمالي الإيرادات" : "Total Revenue"}</p>
          </div>
        </div>
        <div className="ao-rev-divider" />
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="ao-rev-status-item">
            <div className="ao-rev-dot" style={{ background: cfg.dotColor }} />
            <div>
              <p className="ao-rev-value">{statusCounts[key] || 0}</p>
              <p className="ao-rev-label">{isRtl ? cfg.labelAr : cfg.labelEn}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="ao-filter-row">
        <Filter className="size-3.5 text-muted-foreground" />
        {(["ALL", ...Object.keys(STATUS_CONFIG)] as FilterStatus[]).map((s) => {
          const cfg = s !== "ALL" ? STATUS_CONFIG[s] : null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`ao-filter-btn ${filterStatus === s ? "active" : ""}`}
              style={filterStatus === s && cfg ? { background: `${cfg.dotColor}18`, color: cfg.dotColor, borderColor: cfg.dotColor } : {}}
            >
              {s === "ALL"
                ? (isRtl ? "الكل" : "All")
                : (isRtl ? cfg!.labelAr : cfg!.labelEn)
              }
              <span className="ao-filter-count">
                {s === "ALL" ? orders.length : (statusCounts[s] || 0)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="ao-skeleton-list">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="ao-skeleton-card">
              <div className="ao-skeleton ao-sk-icon" />
              <div style={{ flex: 1 }}>
                <div className="ao-skeleton ao-sk-title" />
                <div className="ao-skeleton ao-sk-sub" />
              </div>
              <div className="ao-skeleton ao-sk-pill" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ao-empty">
          <ShoppingCart className="ao-empty-icon" />
          <h3>{isRtl ? "لا توجد طلبات" : "No orders"}</h3>
          <p>{filterStatus !== "ALL"
            ? (isRtl ? "لا توجد طلبات بهذه الحالة" : "No orders with this status")
            : (isRtl ? "لم يتم استلام طلبات بعد" : "No orders received yet")
          }</p>
        </div>
      ) : (
        <div className="ao-list">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG["PENDING"];
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} className="ao-card">
                {/* Card Header (Clickable) */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="ao-card-head"
                >
                  <div className={`ao-status-icon ${cfg.iconClass}`}>
                    <StatusIcon className="size-4" />
                  </div>

                  <div className="ao-card-info">
                    <div className="ao-card-top-row">
                      <span className="ao-order-id">{order.invoiceNo || `ORD-${String(order.id).padStart(5, "0")}`}</span>
                      <span className={`ao-pill ${cfg.pillClass}`}>{isRtl ? cfg.labelAr : cfg.labelEn}</span>
                      {order.channel === "ONLINE_STORE" && (
                        <span className="ao-source-badge web" title={isRtl ? "متجر إلكتروني" : "Online Store"}>
                          <Globe className="size-3" />
                          {isRtl ? "أونلاين" : "Web"}
                        </span>
                      )}
                      {order.channel && order.channel !== "ONLINE_STORE" && (
                        <span className="ao-source-badge pos">
                          <Store className="size-3" />
                          {isRtl ? "متجر" : "Store"}
                        </span>
                      )}
                    </div>
                    <p className="ao-card-meta">
                      <span>{order.customer?.name || (isRtl ? "عميل" : "Customer")}</span>
                      <span className="ao-meta-dot">·</span>
                      <span>{order.items?.length || 0} {isRtl ? "منتج" : "items"}</span>
                      <span className="ao-meta-dot">·</span>
                      <span>{new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </p>
                  </div>

                  <div className="ao-card-right">
                    <span className="ao-total">{Number(order.total || 0).toLocaleString()} EGP</span>
                    {isExpanded
                      ? <ChevronUp className="size-4 text-muted-foreground" />
                      : <ChevronDown className="size-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="ao-expanded">
                    {/* Customer Info */}
                    {order.customer && (
                      <div className="ao-customer-grid">
                        <div className="ao-info-item">
                          <User className="size-3.5 text-muted-foreground" />
                          <div>
                            <p className="ao-info-label">{isRtl ? "الاسم" : "Name"}</p>
                            <p className="ao-info-value">{order.customer.name}</p>
                          </div>
                        </div>
                        <div className="ao-info-item">
                          <Phone className="size-3.5 text-muted-foreground" />
                          <div>
                            <p className="ao-info-label">{isRtl ? "الهاتف" : "Phone"}</p>
                            <p className="ao-info-value" dir="ltr">{order.customer.phone}</p>
                          </div>
                        </div>
                        {order.customer.email && (
                          <div className="ao-info-item">
                            <Mail className="size-3.5 text-muted-foreground" />
                            <div>
                              <p className="ao-info-label">Email</p>
                              <p className="ao-info-value">{order.customer.email}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Items Table */}
                    <div className="ao-items-table-wrap">
                      <table className="ao-items-table">
                        <thead>
                          <tr>
                            <th>{isRtl ? "المنتج" : "Product"}</th>
                            <th>{isRtl ? "الكمية" : "Qty"}</th>
                            <th>{isRtl ? "السعر" : "Unit Price"}</th>
                            <th className="ao-th-end">{isRtl ? "الإجمالي" : "Total"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items?.map((item: any, i: number) => (
                            <tr key={i}>
                              <td>
                                <div className="ao-item-name">
                                  <Package className="size-3.5 text-muted-foreground" />
                                  {item.productName || item.product?.nameEn || `Product #${item.productId}`}
                                </div>
                              </td>
                              <td><span className="ao-qty">{item.quantity}</span></td>
                              <td>{Number(item.unitPrice || item.price || 0).toLocaleString()} EGP</td>
                              <td className="ao-td-end ao-item-total">
                                {Number(item.lineTotal || ((item.unitPrice || item.price || 0) * item.quantity)).toLocaleString()} EGP
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          {order.subtotal != null && (
                            <tr className="ao-tfoot-row">
                              <td colSpan={3}>{isRtl ? "المجموع الفرعي" : "Subtotal"}</td>
                              <td className="ao-td-end">{Number(order.subtotal || 0).toLocaleString()} EGP</td>
                            </tr>
                          )}
                          {order.tax > 0 && (
                            <tr className="ao-tfoot-row">
                              <td colSpan={3}>{isRtl ? "الضريبة" : "Tax"}</td>
                              <td className="ao-td-end">{Number(order.tax).toLocaleString()} EGP</td>
                            </tr>
                          )}
                          {order.shippingFee > 0 && (
                            <tr className="ao-tfoot-row">
                              <td colSpan={3}>{isRtl ? "الشحن" : "Shipping"}</td>
                              <td className="ao-td-end">{Number(order.shippingFee).toLocaleString()} EGP</td>
                            </tr>
                          )}
                          <tr className="ao-tfoot-total">
                            <td colSpan={3}>{isRtl ? "الإجمالي" : "Total"}</td>
                            <td className="ao-td-end">{Number(order.total || 0).toLocaleString()} EGP</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="ao-notes">
                        <FileText className="size-3.5 text-muted-foreground" />
                        <div>
                          <p className="ao-info-label">{isRtl ? "ملاحظات" : "Notes"}</p>
                          <p className="ao-info-value">{order.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Status Actions */}
                     {cfg.nextValues.length > 0 && (
                       <div className="ao-status-actions">
                         <span className="ao-status-actions-label">
                           {isRtl ? "تغيير الحالة إلى:" : "Change status to:"}
                         </span>
                         <select
                           className="ao-status-select"
                           value=""
                           disabled={updatingId === order.id}
                           onChange={(e) => {
                             const val = e.target.value;
                             if (val) handleStatusChange(order.id, val);
                           }}
                         >
                           <option value="" disabled>
                             {updatingId === order.id
                               ? (isRtl ? "جاري التحديث..." : "Updating...")
                               : (isRtl ? "-- اختر --" : "-- Select --")
                             }
                           </option>
                           {cfg.nextValues.map((val, idx) => (
                             <option key={val} value={val}>
                               {isRtl ? cfg.nextAr[idx] : cfg.nextEn[idx]}
                             </option>
                           ))}
                         </select>
                       </div>
                     )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .ao-root { display: flex; flex-direction: column; gap: 1.25rem; }

        .ao-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .ao-title { font-size: 1.65rem; font-weight: 800; }
        .ao-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
        .ao-refresh-btn {
          width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
          border-radius: 0.625rem; border: 1px solid var(--border);
          background: var(--card); color: var(--muted-foreground);
          cursor: pointer; transition: all 0.2s;
        }
        .ao-refresh-btn:hover { background: var(--muted); color: var(--foreground); }
        .ao-spinning { animation: ao-spin 1s linear infinite; }
        @keyframes ao-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Revenue bar */
        .ao-revenue-bar {
          display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1rem; padding: 1rem 1.25rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }
        .ao-rev-item { display: flex; align-items: center; gap: 0.625rem; }
        .ao-rev-divider { width: 1px; height: 32px; background: var(--border); }
        .ao-rev-status-item { display: flex; align-items: center; gap: 0.5rem; }
        .ao-rev-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .ao-rev-value { font-size: 0.95rem; font-weight: 800; color: var(--foreground); }
        .ao-rev-label { font-size: 0.68rem; color: var(--muted-foreground); margin-top: 0.1rem; }

        /* Filter */
        .ao-filter-row {
          display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
        }
        .ao-filter-btn {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.35rem 0.875rem;
          border-radius: 999px; border: 1px solid var(--border);
          background: var(--card); color: var(--muted-foreground);
          font-size: 0.78rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .ao-filter-btn:hover { border-color: var(--primary); color: var(--primary); background: rgba(192,22,27,0.06); }
        .ao-filter-btn.active { font-weight: 700; }
        .ao-source-badge {
          display: inline-flex; align-items: center; gap: 0.2rem;
          padding: 0.1rem 0.45rem; border-radius: 999px;
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.02em;
          line-height: 1.3;
        }
        .ao-source-badge.web {
          background: rgba(16,185,129,0.12); color: #059669;
          border: 1px solid rgba(16,185,129,0.25);
        }
        .ao-source-badge.pos {
          background: rgba(99,102,241,0.12); color: #6366f1;
          border: 1px solid rgba(99,102,241,0.25);
        }
        .ao-filter-count {
          background: var(--muted); color: var(--muted-foreground);
          font-size: 0.65rem; font-weight: 700;
          padding: 0.1rem 0.35rem; border-radius: 999px;
        }

        /* List */
        .ao-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .ao-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1.25rem; overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s;
        }
        .ao-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
        .ao-card-head {
          display: flex; align-items: center; gap: 0.875rem;
          padding: 1rem 1.125rem;
          width: 100%; background: none; border: none;
          cursor: pointer; text-align: start;
          transition: background 0.15s;
        }
        .ao-card-head:hover { background: var(--muted)/40; }

        .ao-status-icon {
          width: 40px; height: 40px; border-radius: 0.875rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .icon-pending   { background: rgba(245,158,11,0.15); color: #b45309; }
        .icon-confirmed { background: rgba(59,130,246,0.15);  color: #1d4ed8; }
        .icon-shipped   { background: rgba(139,92,246,0.15);  color: #6d28d9; }
        .icon-delivered { background: rgba(16,185,129,0.15);  color: #065f46; }
        .icon-cancelled { background: rgba(239,68,68,0.12);   color: #b91c1c; }

        .ao-card-info { flex: 1; min-width: 0; }
        .ao-card-top-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
        .ao-order-id { font-weight: 700; font-size: 0.925rem; color: var(--foreground); }
        .ao-pill {
          font-size: 0.65rem; font-weight: 700;
          padding: 0.15rem 0.5rem; border-radius: 999px;
        }
        .pill-pending   { background: rgba(245,158,11,0.15); color: #b45309; }
        .pill-confirmed { background: rgba(59,130,246,0.15);  color: #1d4ed8; }
        .pill-shipped   { background: rgba(139,92,246,0.15);  color: #6d28d9; }
        .pill-delivered { background: rgba(16,185,129,0.15);  color: #065f46; }
        .pill-cancelled { background: rgba(239,68,68,0.12);   color: #b91c1c; }

        .ao-card-meta {
          font-size: 0.78rem; color: var(--muted-foreground);
          display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap;
        }
        .ao-meta-dot { color: var(--border); }
        .ao-card-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
        .ao-total { font-size: 1rem; font-weight: 800; color: var(--foreground); white-space: nowrap; }

        /* Expanded */
        .ao-expanded {
          border-top: 1px solid var(--border);
          padding: 1.125rem;
          display: flex; flex-direction: column; gap: 1rem;
          background: var(--background);
        }

        .ao-customer-grid {
          display: flex; gap: 1rem; flex-wrap: wrap;
        }
        .ao-info-item { display: flex; align-items: flex-start; gap: 0.5rem; min-width: 140px; }
        .ao-info-label { font-size: 0.7rem; color: var(--muted-foreground); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .ao-info-value { font-size: 0.875rem; font-weight: 600; color: var(--foreground); margin-top: 0.1rem; }

        /* Items Table */
        .ao-items-table-wrap {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 0.875rem; overflow: hidden;
        }
        .ao-items-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
        .ao-items-table thead { background: var(--muted); }
        .ao-items-table th {
          text-align: start; padding: 0.6rem 0.875rem;
          font-weight: 700; color: var(--muted-foreground);
          font-size: 0.7rem; letter-spacing: 0.04em; text-transform: uppercase;
        }
        .ao-th-end { text-align: end; }
        .ao-items-table td { padding: 0.625rem 0.875rem; border-top: 1px solid var(--border); }
        .ao-td-end { text-align: end; }
        .ao-item-name { display: flex; align-items: center; gap: 0.375rem; font-weight: 600; }
        .ao-qty {
          background: var(--muted); font-size: 0.75rem; font-weight: 700;
          padding: 0.15rem 0.5rem; border-radius: 0.375rem;
        }
        .ao-item-total { font-weight: 700; }
        .ao-tfoot-row td { color: var(--muted-foreground); font-size: 0.78rem; background: var(--muted)/30; padding: 0.45rem 0.875rem; }
        .ao-tfoot-total td { font-weight: 800; font-size: 0.9rem; background: var(--muted); padding: 0.6rem 0.875rem; }

        /* Notes */
        .ao-notes { display: flex; align-items: flex-start; gap: 0.5rem; }

        /* Status Actions */
        .ao-status-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .ao-status-actions-label { font-size: 0.78rem; color: var(--muted-foreground); font-weight: 600; }
        .ao-status-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0.4rem 1rem; border-radius: 999px;
          font-size: 0.78rem; font-weight: 700;
          cursor: pointer; transition: all 0.2s; border: 1px solid;
          min-width: 80px;
        }
        .ao-status-btn.advance {
          background: var(--primary); color: #fff; border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(192,22,27,0.25);
        }
        .ao-status-btn.advance:hover { opacity: 0.9; transform: translateY(-1px); }
        .ao-status-btn.cancel {
          background: transparent; color: #ef4444; border-color: rgba(239,68,68,0.3);
        }
        .ao-status-btn.cancel:hover { background: rgba(239,68,68,0.08); }
        .ao-status-select {
          padding: 0.4rem 0.75rem; border-radius: 999px;
          font-size: 0.78rem; font-weight: 600;
          border: 1px solid var(--border);
          background: var(--card); color: var(--foreground);
          cursor: pointer; min-width: 130px;
          outline: none; transition: border-color 0.2s;
        }
        .ao-status-select:focus { border-color: var(--primary); }
        .ao-status-select:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Skeleton */
        .ao-skeleton-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .ao-skeleton-card {
          display: flex; align-items: center; gap: 0.875rem;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1.25rem; padding: 1rem 1.125rem;
        }
        .ao-skeleton {
          background: linear-gradient(90deg, var(--muted) 25%, var(--accent) 50%, var(--muted) 75%);
          background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 0.5rem;
        }
        .ao-sk-icon { width: 40px; height: 40px; border-radius: 0.875rem; flex-shrink: 0; }
        .ao-sk-title { height: 13px; width: 160px; margin-bottom: 0.4rem; }
        .ao-sk-sub { height: 11px; width: 220px; }
        .ao-sk-pill { width: 70px; height: 22px; border-radius: 999px; flex-shrink: 0; }

        /* Empty */
        .ao-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 4rem 2rem; text-align: center;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 1.25rem;
        }
        .ao-empty-icon { width: 56px; height: 56px; color: var(--muted-foreground); opacity: 0.3; margin-bottom: 1rem; }
        .ao-empty h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.35rem; }
        .ao-empty p { color: var(--muted-foreground); font-size: 0.875rem; }
        .ao-search-bar {
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 0.75rem; padding: 0.5rem 0.75rem;
          max-width: 320px;
        }
        .ao-search-input {
          border: none; background: none; outline: none;
          font-size: 0.83rem; width: 100%;
          color: var(--foreground);
        }
        .ao-search-input::placeholder { color: var(--muted-foreground); }
      `}</style>
    </div>
  );
}
