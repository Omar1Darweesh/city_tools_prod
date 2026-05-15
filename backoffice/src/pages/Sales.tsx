import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import * as XLSX from 'xlsx';
import { ShoppingCart, Eye, Filter, X, Download } from 'lucide-react';

interface Sale {
    id: number;
    invoiceNo: string;
    createdAt: string;
    total: number;
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    platformCommission: number;
    shippingFee: number;
    paymentMethod: string;
    paymentStatus: string;
    paidAmount: number;
    remainingAmount: number;
    channel?: string;
    channelName?: string;
    customer?: { name: string };
    user?: { fullName: string; id: number };
    branch?: { name: string };
    costOfGoods?: number;
    grossProfit?: number;
    netProfit?: number;
    profitMargin?: number;
    totalRefunded?: number;
    netRevenue?: number;
}

// ✅ NEW: Add interfaces for users and customers
interface User {
    id: number;
    fullName: string;
}

interface Customer {
    id: number;
    name: string;
}

interface SaleLine {
    productId: number;
    qty: number;
    unitPrice: number;
    lineDiscount: number;
    taxRate: number;
    lineTotal: number;
    product?: { nameAr?: string; nameEn?: string; sku?: string };
}

interface SaleDetails extends Sale {
    lines?: SaleLine[];
}

interface SalesFilters {
    dateFilter: string;
    paymentMethod: string;
    userId: string;
    customerId: string;
    channel: string;
    startDate: string;
    endDate: string;
    search: string;
}

const SALES_FILTERS_STORAGE_KEY = 'backoffice.sales.filters.v1';
const SALES_FILTERS_PANEL_STORAGE_KEY = 'backoffice.sales.filters.panel.v1';

const defaultFilters: SalesFilters = {
    dateFilter: 'all',
    paymentMethod: 'ALL',
    userId: 'ALL',
    customerId: 'ALL',
    channel: 'ALL',
    startDate: '',
    endDate: '',
    search: '',
};

const loadSavedFilters = (): SalesFilters => {
    if (typeof window === 'undefined') return defaultFilters;
    try {
        const raw = window.localStorage.getItem(SALES_FILTERS_STORAGE_KEY);
        if (!raw) return defaultFilters;
        const parsed = JSON.parse(raw);
        return { ...defaultFilters, ...parsed };
    } catch {
        return defaultFilters;
    }
};

const loadSavedFilterPanel = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SALES_FILTERS_PANEL_STORAGE_KEY) === '1';
};

export default function Sales() {
    const navigate = useNavigate();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [channels, setChannels] = useState<string[]>([]); // ✅ NEW

    // ✅ UPDATED: Add new filter fields
    const [filters, setFilters] = useState<SalesFilters>(() => loadSavedFilters());

    const [showFilters, setShowFilters] = useState(() => loadSavedFilterPanel());

    // ✅ NEW: Fetch users and customers for dropdowns
    useEffect(() => {
        fetchUsersAndCustomers();
    }, []);

    const fetchUsersAndCustomers = async () => {
        try {
            // Fetch users
            const usersRes = await apiClient.get('/users');
            setUsers(usersRes.data.data || usersRes.data || []);

            // ✅ FIXED: Correct endpoint
            const customersRes = await apiClient.get('/pos/customers');
            setCustomers(customersRes.data || []);

            // ✅ NEW: Fetch channels from database
            const channelsRes = await apiClient.get('/pos/channels');
            setChannels(channelsRes.data || []);
        } catch (error) {
            console.error('Failed to fetch users/customers:', error);
        }
    };


    useEffect(() => {
        fetchSales();

        const handleFocus = () => fetchSales();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [filters]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(SALES_FILTERS_STORAGE_KEY, JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(SALES_FILTERS_PANEL_STORAGE_KEY, showFilters ? '1' : '0');
    }, [showFilters]);

    const buildSalesQueryParams = (forExport = false) => {
        const params: any = {};

        if (filters.dateFilter !== 'all') {
            params.dateFilter = filters.dateFilter;
        }

        if (filters.dateFilter === 'custom' && filters.startDate && filters.endDate) {
            params.startDate = filters.startDate;
            params.endDate = filters.endDate;
        }

        if (filters.paymentMethod !== 'ALL') {
            params.paymentMethod = filters.paymentMethod;
        }

        if (filters.userId !== 'ALL') {
            params.userId = filters.userId;
        }

        if (filters.customerId !== 'ALL') {
            params.customerId = filters.customerId;
        }

        if (filters.channel !== 'ALL') {
            params.channel = filters.channel;
        }

        if (filters.search) {
            params.search = filters.search;
        }

        if (forExport) {
            params.take = 10000;
            params.skip = 0;
        }

        return params;
    };

    const fetchSales = async () => {
        setLoading(true);
        try {
            const params = buildSalesQueryParams();
            const res = await apiClient.get('/pos/sales', { params });
            setSales(res.data.data);
        } catch (error) {
            console.error('Failed to fetch sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const getExportRangeLabel = () => {
        if (filters.dateFilter === 'custom' && filters.startDate && filters.endDate) {
            return `${filters.startDate}_to_${filters.endDate}`;
        }
        if (filters.dateFilter && filters.dateFilter !== 'all') {
            return filters.dateFilter;
        }
        return 'all';
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const params = buildSalesQueryParams(true);
            const listRes = await apiClient.get('/pos/sales', { params });
            const exportSales: Sale[] = listRes.data?.data || [];

            if (exportSales.length === 0) {
                alert('لا توجد فواتير للتصدير حسب الفلاتر الحالية');
                return;
            }

            const detailsResponses = await Promise.all(
                exportSales.map((sale) =>
                    apiClient
                        .get(`/pos/sales/${sale.id}`)
                        .then((r) => r.data as SaleDetails)
                        .catch(() => null),
                ),
            );

            const saleDetails: SaleDetails[] = detailsResponses.filter(Boolean) as SaleDetails[];
            const detailsMap = new Map<number, SaleDetails>(saleDetails.map((d) => [d.id, d]));

            const invoiceRows = exportSales.map((sale) => {
                const netRevenue = Number(sale.netRevenue != null ? sale.netRevenue : sale.total || 0);
                const netProfit = Number(sale.netProfit || 0);
                return {
                    'رقم الفاتورة': sale.invoiceNo,
                    'التاريخ': new Date(sale.createdAt).toLocaleString('ar-EG'),
                    'العميل': sale.customer?.name || 'عميل نقدي (Retail)',
                    'القناة': sale.channelName || sale.channel || '-',
                    'طريقة الدفع': sale.paymentMethod,
                    'حالة الدفع': sale.paymentStatus,
                    'الصافي قبل الضريبة': Number(sale.subtotal || 0),
                    'الخصم': Number(sale.totalDiscount || 0),
                    'الضريبة': Number(sale.totalTax || 0),
                    'عمولة المنصة': Number(sale.platformCommission || 0),
                    'رسوم الشحن': Number(sale.shippingFee || 0),
                    'الإجمالي': Number(sale.total || 0),
                    'المرتجع': Number(sale.totalRefunded || 0),
                    'صافي الإيراد': netRevenue,
                    'التكلفة': Number(sale.costOfGoods || 0),
                    'الربح الصافي': netProfit,
                    'هامش الربح %': Number(sale.profitMargin || 0),
                    'المدفوع': Number(sale.paidAmount || 0),
                    'المتبقي': Number(sale.remainingAmount || 0),
                    'نتيجة الفاتورة': netProfit > 0 ? 'ربح' : netProfit < 0 ? 'خسارة' : 'تعادل',
                    'المستخدم': sale.user?.fullName || '-',
                    'الفرع': sale.branch?.name || '-',
                };
            });

            const lineRows = exportSales.flatMap((sale) => {
                const details = detailsMap.get(sale.id);
                const lines = details?.lines || [];

                if (lines.length === 0) {
                    return [{
                        'رقم الفاتورة': sale.invoiceNo,
                        'التاريخ': new Date(sale.createdAt).toLocaleString('ar-EG'),
                        'اسم المنتج': '-',
                        'SKU': '-',
                        'الكمية': 0,
                        'سعر الوحدة': 0,
                        'خصم السطر': 0,
                        'ضريبة %': 0,
                        'إجمالي السطر': 0,
                    }];
                }

                return lines.map((line) => ({
                    'رقم الفاتورة': sale.invoiceNo,
                    'التاريخ': new Date(sale.createdAt).toLocaleString('ar-EG'),
                    'اسم المنتج': line.product?.nameAr || line.product?.nameEn || `#${line.productId}`,
                    'SKU': line.product?.sku || '-',
                    'الكمية': Number(line.qty || 0),
                    'سعر الوحدة': Number(line.unitPrice || 0),
                    'خصم السطر': Number(line.lineDiscount || 0),
                    'ضريبة %': Number(line.taxRate || 0),
                    'إجمالي السطر': Number(line.lineTotal || 0),
                }));
            });

            const summary = exportSales.reduce(
                (acc, sale) => {
                    acc.invoices += 1;
                    acc.subtotal += Number(sale.subtotal || 0);
                    acc.discount += Number(sale.totalDiscount || 0);
                    acc.tax += Number(sale.totalTax || 0);
                    acc.commission += Number(sale.platformCommission || 0);
                    acc.shipping += Number(sale.shippingFee || 0);
                    acc.total += Number(sale.total || 0);
                    acc.refunded += Number(sale.totalRefunded || 0);
                    acc.netRevenue += Number(sale.netRevenue != null ? sale.netRevenue : sale.total || 0);
                    acc.cost += Number(sale.costOfGoods || 0);
                    acc.netProfit += Number(sale.netProfit || 0);
                    acc.paid += Number(sale.paidAmount || 0);
                    acc.remaining += Number(sale.remainingAmount || 0);
                    return acc;
                },
                {
                    invoices: 0,
                    subtotal: 0,
                    discount: 0,
                    tax: 0,
                    commission: 0,
                    shipping: 0,
                    total: 0,
                    refunded: 0,
                    netRevenue: 0,
                    cost: 0,
                    netProfit: 0,
                    paid: 0,
                    remaining: 0,
                },
            );

            const margin = summary.netRevenue > 0 ? (summary.netProfit / summary.netRevenue) * 100 : 0;

            const summaryRows = [
                { 'البند': 'الفترة', 'القيمة': getExportRangeLabel() },
                { 'البند': 'عدد الفواتير', 'القيمة': summary.invoices },
                { 'البند': 'الصافي قبل الضريبة', 'القيمة': summary.subtotal.toFixed(2) },
                { 'البند': 'الخصومات', 'القيمة': summary.discount.toFixed(2) },
                { 'البند': 'الضريبة', 'القيمة': summary.tax.toFixed(2) },
                { 'البند': 'عمولة المنصة', 'القيمة': summary.commission.toFixed(2) },
                { 'البند': 'رسوم الشحن', 'القيمة': summary.shipping.toFixed(2) },
                { 'البند': 'الإجمالي', 'القيمة': summary.total.toFixed(2) },
                { 'البند': 'المرتجعات', 'القيمة': summary.refunded.toFixed(2) },
                { 'البند': 'صافي الإيراد', 'القيمة': summary.netRevenue.toFixed(2) },
                { 'البند': 'التكلفة', 'القيمة': summary.cost.toFixed(2) },
                { 'البند': 'الربح الصافي', 'القيمة': summary.netProfit.toFixed(2) },
                { 'البند': 'هامش الربح %', 'القيمة': margin.toFixed(2) },
                { 'البند': 'المدفوع', 'القيمة': summary.paid.toFixed(2) },
                { 'البند': 'المتبقي', 'القيمة': summary.remaining.toFixed(2) },
                { 'البند': 'النتيجة', 'القيمة': summary.netProfit > 0 ? 'ربح' : summary.netProfit < 0 ? 'خسارة' : 'تعادل' },
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoiceRows), 'فواتير المبيعات');
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lineRows), 'تفاصيل البنود');
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'ملخص الربح والخسارة');

            const fileName = `sales-export-${getExportRangeLabel()}-${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('Sales export failed:', error);
            alert('حدث خطأ أثناء تصدير الملف. حاول مرة أخرى.');
        } finally {
            setExporting(false);
        }
    };

    const handleViewDetails = (saleId: number) => {
        navigate(`/sales/${saleId}`);
    };

    const resetFilters = () => {
        setFilters(defaultFilters);
    };

    const totals = sales.length > 0 ? {
        subtotal:    sales.reduce((s, x) => s + Number(x.subtotal    || 0), 0),
        discount:    sales.reduce((s, x) => s + Number(x.totalDiscount || 0), 0),
        tax:         sales.reduce((s, x) => s + Number(x.totalTax     || 0), 0),
        commission:  sales.reduce((s, x) => s + Number(x.platformCommission || 0), 0),
        shipping:    sales.reduce((s, x) => s + Number(x.shippingFee  || 0), 0),
        total:       sales.reduce((s, x) => s + Number(x.total        || 0), 0),
        refunded:    sales.reduce((s, x) => s + Number(x.totalRefunded || 0), 0),
        netRevenue:  sales.reduce((s, x) => s + Number(x.netRevenue != null ? x.netRevenue : x.total), 0),
        remaining:   sales.reduce((s, x) => s + Number(x.remainingAmount || 0), 0),
        cost:        sales.reduce((s, x) => s + Number(x.costOfGoods  || 0), 0),
        netProfit:   sales.reduce((s, x) => s + Number(x.netProfit    || 0), 0),
        paidAmount:  sales.reduce((s, x) => s + Number(x.paidAmount   || 0), 0),
    } : null;
    const avgMargin = totals && totals.netRevenue > 0 ? (totals.netProfit / totals.netRevenue) * 100 : 0;

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShoppingCart size={32} color="#2563eb" />
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>المبيعات</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={handleExportExcel}
                        disabled={exporting || loading}
                        style={{
                            padding: '10px 16px',
                            background: exporting ? '#94a3b8' : '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: exporting || loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '600',
                        }}
                    >
                        <Download size={18} />
                        {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
                    </button>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            padding: '10px 16px',
                            background: showFilters ? '#2563eb' : 'white',
                            color: showFilters ? 'white' : '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '500',
                        }}
                    >
                        <Filter size={18} />
                        {showFilters ? 'إخفاء الفلتر' : 'إظهار الفلتر'}
                    </button>
                </div>
            </div>

            {/* ✅ UPDATED: Filters Panel with 7 filters */}
            {showFilters && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                        {/* Search */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                بحث (رقم الفاتورة أو العميل)
                            </label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="ابحث..."
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            />
                        </div>

                        {/* Date Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                فترة زمنية
                            </label>
                            <select
                                value={filters.dateFilter}
                                onChange={(e) => setFilters({ ...filters, dateFilter: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            >
                                <option value="all">الكل</option>
                                <option value="today">اليوم</option>
                                <option value="yesterday">أمس</option>
                                <option value="thisWeek">هذا الأسبوع</option>
                                <option value="thisMonth">هذا الشهر</option>
                                <option value="custom">تخصيص</option>
                            </select>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                طريقة الدفع
                            </label>
                            <select
                                value={filters.paymentMethod}
                                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            >
                                <option value="ALL">الكل</option>
                                <option value="CASH">نقدي</option>
                                <option value="CARD">بطاقة</option>
                                <option value="TRANSFER">تحويل</option>
                                <option value="INSTAPAY">إنستاباي</option>
                                <option value="FAWRY">فوري</option>
                                <option value="WALLET">محفظة</option>
                            </select>
                        </div>

                        {/* ✅ NEW: User Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                بواسطة (المستخدم)
                            </label>
                            <select
                                value={filters.userId}
                                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            >
                                <option value="ALL">جميع المستخدمين</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.fullName}</option>
                                ))}
                            </select>
                        </div>

                        {/* ✅ NEW: Customer Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                العميل
                            </label>
                            <select
                                value={filters.customerId}
                                onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            >
                                <option value="ALL">جميع العملاء</option>
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* ✅ UPDATED: Channel Filter - Dynamic from DB */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                القناة
                            </label>
                            <select
                                value={filters.channel}
                                onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            >
                                <option value="ALL">جميع القنوات</option>
                                {channels.map(channel => (
                                    <option key={channel} value={channel}>{channel}</option>
                                ))}
                            </select>
                        </div>


                        {/* Reset Button */}
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                onClick={resetFilters}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                            >
                                <X size={16} />
                                إعادة تعيين
                            </button>
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    {filters.dateFilter === 'custom' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                    من تاريخ
                                </label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                    إلى تاريخ
                                </label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sales Table */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        {/* ✅ UPDATED TABLE HEADERS */}
                        <thead style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>رقم الفاتورة</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>التاريخ والوقت</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>العميل</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>الصافي</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>الخصم</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>الضريبة</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>عمولة المنصة</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>
                                    رسوم الشحن
                                </th>

                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>الإجمالي</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>المرتجع</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>الصافي</th>

                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>حالة الدفع</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>المتبقي</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>التكلفة</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>الربح الصافي</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>الهامش %</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>القناة</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>المدفوع</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>بواسطة</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>إجراءات</th>
                            </tr>
                        </thead>

                        {/* ✅ UPDATED TABLE BODY */}
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={19} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        جاري التحميل...
                                    </td>
                                </tr>
                            ) : sales.length === 0 ? (
                                <tr>
                                    <td colSpan={19} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        لا توجد مبيعات
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr key={sale.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#2563eb' }}>
                                            {sale.invoiceNo}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {new Date(sale.createdAt).toLocaleString('ar-EG', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true,
                                            })}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {sale.customer?.name || 'عميل نقدي (Retail)'}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {Number(sale.subtotal || 0).toFixed(2)} ج.م
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {sale.totalDiscount > 0 ? `-${Number(sale.totalDiscount).toFixed(2)} ج.م` : '-'}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            +{Number(sale.totalTax || 0).toFixed(2)} ج.م
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {sale.platformCommission > 0 ? `+${Number(sale.platformCommission).toFixed(2)} ج.م` : '-'}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {sale.shippingFee && sale.shippingFee > 0 ? `${Number(sale.shippingFee).toFixed(2)} ج.م` : '-'}
                                        </td>

                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '700', fontSize: '15px' }}>
                                            {Number(sale.total).toFixed(2)} ج.م
                                        </td>

                                        {/* After Total cell */}
                                        <td style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #e5e7eb',
                                            color: sale.totalRefunded && sale.totalRefunded > 0 ? '#dc2626' : '#6b7280',
                                            fontWeight: sale.totalRefunded && sale.totalRefunded > 0 ? 'bold' : 'normal'
                                        }}>
                                            {sale.totalRefunded && sale.totalRefunded > 0
                                                ? `-${Number(sale.totalRefunded).toFixed(2)} ج.م`
                                                : '-'}
                                        </td>

                                        <td style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #e5e7eb',
                                            fontWeight: '600',
                                            fontSize: '15px'
                                        }}>
                                            {sale.netRevenue !== undefined
                                                ? `${Number(sale.netRevenue).toFixed(2)} ج.م`
                                                : `${Number(sale.total).toFixed(2)} ج.م`}
                                        </td>


                                        {/* ✅ NEW: Payment Status Cell */}
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {sale.paymentStatus === 'PAID' ? (
                                                <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                                                    مدفوع
                                                </span>
                                            ) : sale.paymentStatus === 'PARTIAL' ? (
                                                <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fed7aa', color: '#ea580c' }}>
                                                    مدفوع جزئياً
                                                </span>
                                            ) : (
                                                <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                                    غير مدفوع
                                                </span>
                                            )}
                                        </td>

                                        {/* ✅ NEW: Remaining Amount Cell */}
                                        <td style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #e5e7eb',
                                            fontWeight: '600',
                                            color: sale.remainingAmount > 0 ? '#dc2626' : '#16a34a'
                                        }}>
                                            {sale.remainingAmount > 0 ? `${Number(sale.remainingAmount).toFixed(2)} ج.م` : '-'}
                                        </td>

                                        {/* Profit Cells */}
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {sale.costOfGoods !== undefined ? `${sale.costOfGoods.toFixed(2)} ج.م` : '-'}
                                        </td>
                                        <td style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #e5e7eb',
                                            color: (sale.netProfit || 0) >= 0 ? '#16a34a' : '#dc2626',
                                            fontWeight: 'bold'
                                        }}>
                                            {sale.netProfit !== undefined ? `${sale.netProfit.toFixed(2)} ج.م` : '-'}
                                        </td>
                                        <td style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #e5e7eb',
                                            color: (sale.profitMargin || 0) >= 0 ? '#16a34a' : '#dc2626',
                                            fontWeight: '600'
                                        }}>
                                            {sale.profitMargin !== undefined ? `${sale.profitMargin.toFixed(1)}%` : '-'}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {sale.channelName || sale.channel || '-'}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {sale.paymentMethod}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            {sale.user?.fullName || '-'}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                            <button
                                                onClick={() => handleViewDetails(sale.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#2563eb',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '13px',
                                                }}
                                            >
                                                <Eye size={14} />
                                                عرض
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                        {/* ── Totals footer row ── */}
                        {!loading && totals && (
                            <tfoot>
                                <tr style={{ background: '#f8fafc', color: '#0f172a', fontWeight: '700', fontSize: '13px', borderTop: '2px solid #2563eb' }}>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#334155' }}>الإجمالي ({sales.length})</td>
                                    <td style={{ padding: '14px 16px' }} />
                                    <td style={{ padding: '14px 16px' }} />
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>{totals.subtotal.toFixed(2)} ج.م</td>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#dc2626' }}>{totals.discount > 0 ? `-${totals.discount.toFixed(2)} ج.م` : '—'}</td>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#b45309' }}>{totals.tax > 0 ? `+${totals.tax.toFixed(2)} ج.م` : '—'}</td>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#c2410c' }}>{totals.commission > 0 ? `+${totals.commission.toFixed(2)} ج.م` : '—'}</td>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>{totals.shipping > 0 ? `${totals.shipping.toFixed(2)} ج.م` : '—'}</td>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#0369a1', fontSize: '14px' }}>{totals.total.toFixed(2)} ج.م</td>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#dc2626' }}>{totals.refunded > 0 ? `-${totals.refunded.toFixed(2)} ج.م` : '—'}</td>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#2563eb', fontSize: '14px' }}>{totals.netRevenue.toFixed(2)} ج.م</td>
                                    <td style={{ padding: '14px 16px' }} />
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: totals.remaining > 0 ? '#dc2626' : '#16a34a' }}>{totals.remaining > 0 ? `${totals.remaining.toFixed(2)} ج.م` : '—'}</td>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#334155' }}>{totals.cost.toFixed(2)} ج.م</td>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: totals.netProfit >= 0 ? '#16a34a' : '#dc2626', fontSize: '15px' }}>{totals.netProfit.toFixed(2)} ج.م</td>
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: avgMargin >= 0 ? '#16a34a' : '#dc2626' }}>{avgMargin.toFixed(1)}%</td>
                                    <td style={{ padding: '14px 16px' }} />
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#0f766e' }}>{totals.paidAmount.toFixed(2)} ج.م</td>
                                    <td style={{ padding: '14px 16px' }} />
                                    <td style={{ padding: '14px 16px' }} />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* ── Summary Panel ── */}
            {!loading && totals && (() => {
                const isProfit = totals.netProfit >= 0;
                const profitColor = isProfit ? '#16a34a' : '#dc2626';
                const profitBg   = isProfit ? '#f0fdf4' : '#fef2f2';
                const profitBorder = isProfit ? '#bbf7d0' : '#fecaca';
                return (
                    <div style={{ marginTop: '16px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        {/* Top bar — profit/loss verdict */}
                        <div style={{ background: profitBg, borderBottom: `1px solid ${profitBorder}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                            <span style={{ color: '#0f172a', fontWeight: '700', fontSize: '15px' }}>
                                {isProfit ? '✔ الفترة المحددة في ربح' : '✖ الفترة المحددة في خسارة'} — {sales.length} فاتورة
                            </span>
                            <span style={{ color: profitColor, fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' }}>
                                {isProfit ? '+' : ''}{totals.netProfit.toFixed(2)} ج.م &nbsp;
                                <span style={{ fontSize: '14px', opacity: 0.9, fontWeight: '600' }}>({avgMargin.toFixed(1)}% هامش)</span>
                            </span>
                        </div>

                        {/* Two-column layout: Revenue flow | Profit flow */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0', borderTop: 'none' }}>

                            {/* LEFT: Revenue breakdown */}
                            <div style={{ padding: '20px 24px', borderLeft: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                                    تدفق الإيرادات
                                </div>
                                {[
                                    { label: 'الصافي (قبل الضريبة)', value: totals.subtotal,   color: '#1e40af', prefix: '' },
                                    { label: 'الخصومات',              value: totals.discount,    color: '#dc2626', prefix: '−', hide: totals.discount === 0 },
                                    { label: 'الضريبة',               value: totals.tax,         color: '#b45309', prefix: '+', hide: totals.tax === 0 },
                                    { label: 'عمولة المنصة',          value: totals.commission,  color: '#c2410c', prefix: '+', hide: totals.commission === 0 },
                                    { label: 'رسوم الشحن',           value: totals.shipping,    color: '#7c3aed', prefix: '+', hide: totals.shipping === 0 },
                                    { label: 'الإجمالي',              value: totals.total,       color: '#0369a1', prefix: '=', bold: true },
                                    { label: 'المرتجعات',             value: totals.refunded,    color: '#dc2626', prefix: '−', hide: totals.refunded === 0 },
                                    { label: 'صافي الإيراد',          value: totals.netRevenue,  color: '#1d4ed8', prefix: '=', bold: true },
                                ].filter(r => !r.hide).map((row, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '7px 0',
                                        borderTop: row.bold ? '1px solid #e2e8f0' : undefined,
                                        marginTop: row.bold ? '6px' : undefined,
                                    }}>
                                        <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '18px', fontSize: '13px', color: row.color, fontWeight: '700', textAlign: 'center' }}>{row.prefix}</span>
                                            {row.label}
                                        </span>
                                        <span style={{ fontSize: row.bold ? '15px' : '13px', fontWeight: row.bold ? '800' : '600', color: row.color }}>
                                            {row.value.toFixed(2)} ج.م
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* RIGHT: Profit breakdown */}
                            <div style={{ padding: '20px 24px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                                    تدفق الأرباح
                                </div>
                                {[
                                    { label: 'صافي الإيراد',    value: totals.netRevenue, color: '#1d4ed8', prefix: '' },
                                    { label: 'تكلفة البضاعة',   value: totals.cost,       color: '#475569', prefix: '−' },
                                    { label: 'الربح الصافي',    value: totals.netProfit,  color: profitColor, prefix: '=', bold: true },
                                ].map((row, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '7px 0',
                                        borderTop: row.bold ? '1px solid #e2e8f0' : undefined,
                                        marginTop: row.bold ? '6px' : undefined,
                                    }}>
                                        <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '18px', fontSize: '13px', color: row.color, fontWeight: '700', textAlign: 'center' }}>{row.prefix}</span>
                                            {row.label}
                                        </span>
                                        <span style={{ fontSize: row.bold ? '15px' : '13px', fontWeight: row.bold ? '800' : '600', color: row.color }}>
                                            {row.value.toFixed(2)} ج.م
                                        </span>
                                    </div>
                                ))}

                                {/* Net profit highlight */}
                                <div style={{ marginTop: '16px', background: profitBg, border: `1.5px solid ${profitBorder}`, borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>هامش الربح الإجمالي</div>
                                        <div style={{ fontSize: '22px', fontWeight: '800', color: profitColor }}>{avgMargin.toFixed(1)}%</div>
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>المتبقي على العملاء</div>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: totals.remaining > 0 ? '#dc2626' : '#16a34a' }}>
                                            {totals.remaining > 0 ? `${totals.remaining.toFixed(2)} ج.م` : 'لا يوجد متبقي'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
