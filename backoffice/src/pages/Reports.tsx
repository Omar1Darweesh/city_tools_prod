import { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, ShoppingBag, DollarSign, Package, Users,
    Calendar, Download, RefreshCw, FileText, Target, AlertTriangle,
    TrendingDown, Activity, PieChart, Wallet, Receipt, CreditCard, Banknote, Tag
} from 'lucide-react';
import apiClient from '../api/client';

// @ts-ignore - jspdf-autotable types
import type jsPDF from 'jspdf';

// Types
interface DateRange {
    startDate: string;
    endDate: string;
    label: string;
}

interface DashboardMetrics {
    sales: {
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
        totalReturns: number;
        netSales: number;
    };
    financial: {
        grossProfit: number;
        profitMargin: number;
        totalCost: number;
        totalTax: number;
        totalCommission: number;
        netProfit: number;
    };
    inventory: {
        totalStockValue: number;
        lowStockCount: number;
        outOfStockCount: number;
        totalProducts: number;
    };
    performance: {
        topProducts: Array<{
            productName: string;
            quantity: number;
            revenue: number;
            profit: number;
        }>;
        salesByChannel: Array<{
            channel: string;
            channelName: string;
            total: number;
            count: number;
            percentage: number;
        }>;
        salesByPayment: Array<{
            method: string;
            total: number;
            count: number;
        }>;
        salesByCategory: Array<{
            name: string;
            total: number;
            count: number;
        }>;
        hourlyStats: Array<{
            hour: string;
            total: number;
            count: number;
        }>;
    };
    // NEW: Enhanced analytics sections
    customers?: {
        totalCustomers: number;
        customersByType: Array<{ type: string; count: number }>;
        topCustomers: Array<{
            customerId: number;
            name: string;
            type: string;
            totalRevenue: number;
            orderCount: number;
        }>;
        registeredSales: number;
        walkInSales: number;
    };
    returns?: {
        totalReturnsValue: number;
        totalReturnsCount: number;
        returnRate: number;
        returnsByType: Array<{
            type: string;
            count: number;
            qty: number;
            value: number;
        }>;
        topReturnedProducts: Array<{
            productId: number;
            productName: string;
            qtyReturned: number;
            refundAmount: number;
        }>;
    };
    trends?: {
        dailySales: Array<{
            date: string;
            total: number;
            count: number;
            profit: number;
        }>;
    };
    profitByCategory?: Array<{
        category: string;
        revenue: number;
        cost: number;
        profit: number;
        qty: number;
        margin: number;
    }>;
    comparison?: {
        current: { revenue: number; profit: number; orders: number };
        previous: { revenue: number; profit: number; orders: number };
        changes: {
            revenueChange: number;
            profitChange: number;
            orderChange: number;
            revenueDirection: 'up' | 'down' | 'same';
            profitDirection: 'up' | 'down' | 'same';
            orderDirection: 'up' | 'down' | 'same';
        };
    } | null;
}

// ✅ NEW: Platform Sales Details Interface
interface PlatformSalesDetails {
    dateRange: {
        startDate: string | null;
        endDate: string | null;
    };
    summary: {
        grossRevenue: number;
        netRevenue: number;
        refunded: number;
        commission: number;
        tax: number;
        costOfGoods: number;
        grossProfit: number;
        netProfit: number;
        orderCount: number;
        shippingFee: number;
        avgProfitMargin: number;
        avgOrderValue: number;
    };
    platforms: Array<{
        platform: string;
        platformName: string;
        platformIcon: string;
        grossRevenue: number;
        netRevenue: number;
        refunded: number;
        refundRate: number;
        costOfGoods: number;
        commission: number;
        tax: number;
        shippingFee: number;
        grossProfit: number;
        netProfit: number;
        profitMargin: number;
        netProfitMargin: number;
        orderCount: number;
        avgOrderValue: number;
        avgProfit: number;
        actualCommissionRate: number;
        configuredCommissionRate: number;
        actualTaxRate: number;
        configuredTaxRate: number;
        revenuePercentage: number;
        profitPercentage: number;
        orderPercentage: number;
        isConfigured: boolean;
        isActive: boolean;
    }>;
    platformCount: number;
    comparison: {
        currentPeriod: any;
        previousPeriod: any;
        platformChanges: Array<{
            platform: string;
            revenueChange: number;
            profitChange: number;
            orderChange: number;
            isNew: boolean;
        }>;
    } | null;
}

// Helper to format date as YYYY-MM-DD in local time
const formatDate = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

function getToday(): DateRange {
    const today = formatDate(new Date());
    return { startDate: today, endDate: today, label: 'اليوم' };
}

function getYesterday(): DateRange {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = formatDate(yesterday);
    return { startDate: date, endDate: date, label: 'أمس' };
}

function getThisWeek(): DateRange {
    const today = new Date();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - today.getDay());
    return {
        startDate: formatDate(firstDay),
        endDate: formatDate(new Date()),
        label: 'هذا الأسبوع'
    };
}

function getThisMonth(): DateRange {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
        startDate: formatDate(firstDay),
        endDate: formatDate(today),
        label: 'هذا الشهر'
    };
}

export default function Reports() {
    const [dateRange, setDateRange] = useState<DateRange>(getToday());
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'financial' | 'inventory' | 'expenses'>('overview');
    const [showCustomDateRange, setShowCustomDateRange] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    // ✅ NEW: Platform sales state
    const [platformSales, setPlatformSales] = useState<PlatformSalesDetails | null>(null);
    const [loadingPlatformSales, setLoadingPlatformSales] = useState(false);
    // Expenses & Suppliers for the selected period
    const [expensesReport, setExpensesReport] = useState<any>(null);
    const [suppliersReport, setSuppliersReport] = useState<any>(null);

    useEffect(() => {
        fetchReports();
        fetchPlatformSales(); // ✅ Fetch platform sales when date changes
        fetchExpensesReport();
        fetchSuppliersReport();
    }, [dateRange]);

    const handleCustomDateRange = () => {
        if (customStartDate && customEndDate) {
            setDateRange({
                startDate: customStartDate,
                endDate: customEndDate,
                label: 'تاريخ مخصص'
            });
            setShowCustomDateRange(false);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const branchId = user.branchId || 1;

            // Convert YYYY-MM-DD to local start/end ISO strings to ensure timezone accuracy
            const getLocalISO = (dateStr: string, isEnd = false) => {
                const parts = dateStr.split('-').map(Number);
                const date = new Date(parts[0], parts[1] - 1, parts[2]);
                if (isEnd) {
                    date.setHours(23, 59, 59, 999);
                } else {
                    date.setHours(0, 0, 0, 0);
                }
                // We need the absolute instant that corresponds to this local time
                // toISOString() uses UTC. 
                // Example: Local 00:00 (+02) -> UTC 22:00 (prev day)
                // This is EXACTLY what the backend needs to filter correctly against stored UTC timestamps
                return date.toISOString();
            };

            const response = await apiClient.get('/reports/enhanced', {
                params: {
                    startDate: getLocalISO(dateRange.startDate),
                    endDate: getLocalISO(dateRange.endDate, true),
                    branchId
                }
            });

            setMetrics(response.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            setMetrics({
                sales: {
                    totalRevenue: 0,
                    orderCount: 0,
                    averageOrderValue: 0,
                    totalReturns: 0,
                    netSales: 0
                },
                financial: {
                    grossProfit: 0,
                    profitMargin: 0,
                    totalCost: 0,
                    totalTax: 0,
                    totalCommission: 0,
                    netProfit: 0
                },
                inventory: {
                    totalStockValue: 0,
                    lowStockCount: 0,
                    outOfStockCount: 0,
                    totalProducts: 0
                },
                performance: {
                    topProducts: [],
                    salesByChannel: [],
                    salesByPayment: [],
                    salesByCategory: [],
                    hourlyStats: []
                }
            });
        } finally {
            setLoading(false);
        }
    };

    // ✅ NEW: Fetch Platform Sales Details
    const fetchPlatformSales = async () => {
        setLoadingPlatformSales(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const branchId = user.branchId || 1;

            const getLocalISO = (dateStr: string, isEnd = false) => {
                const parts = dateStr.split('-').map(Number);
                const date = new Date(parts[0], parts[1] - 1, parts[2]);
                if (isEnd) {
                    date.setHours(23, 59, 59, 999);
                } else {
                    date.setHours(0, 0, 0, 0);
                }
                return date.toISOString();
            };

            const response = await apiClient.get('/reports/platform-sales', {
                params: {
                    startDate: getLocalISO(dateRange.startDate),
                    endDate: getLocalISO(dateRange.endDate, true),
                    branchId,
                    includeComparison: 'true'
                }
            });

            setPlatformSales(response.data);
        } catch (error) {
            console.error('Failed to fetch platform sales:', error);
            setPlatformSales(null);
        } finally {
            setLoadingPlatformSales(false);
        }
    };

    const fetchExpensesReport = async () => {
        try {
            const { data } = await apiClient.get('/expenses/stats', {
                params: {
                    dateFrom: dateRange.startDate,
                    dateTo: dateRange.endDate,
                }
            });
            setExpensesReport(data);
        } catch (e) {
            console.error('Failed to fetch expenses report', e);
            setExpensesReport(null);
        }
    };

    const fetchSuppliersReport = async () => {
        try {
            const { data } = await apiClient.get('/purchasing/suppliers/stats');
            setSuppliersReport(data);
        } catch (e) {
            console.error('Failed to fetch suppliers report', e);
            setSuppliersReport(null);
        }
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        if (!metrics) return;

        const totalExpenses = Number(expensesReport?.totalExpenses || 0);
        const totalExpensesCount = Number(expensesReport?.totalCount || 0);
        const suppliersBalance = Number(suppliersReport?.totalBalance || 0);
        const adjustedNetProfit = Number(metrics.financial.netProfit) - totalExpenses;
        const safePercent = (num: number, den: number) => (den > 0 ? ((num / den) * 100).toFixed(1) : '0.0');

        if (format === 'pdf') {
            const jsPDFModule = await import('jspdf');
            const html2canvasModule = await import('html2canvas');
            const PDF = jsPDFModule.default;
            const html2canvas = html2canvasModule.default;

            const topChannel = (metrics.performance.salesByChannel || []).slice().sort((a, b) => b.total - a.total)[0];
            const topProduct = (metrics.performance.topProducts || []).slice().sort((a, b) => b.revenue - a.revenue)[0];
            const topExpenseCategory = (expensesReport?.byCategory || []).slice().sort((a: any, b: any) => Number(b.total || 0) - Number(a.total || 0))[0];
            const returnRate = metrics.returns?.returnRate || (metrics.sales.totalRevenue > 0 ? (metrics.sales.totalReturns / metrics.sales.totalRevenue) * 100 : 0);
            const inventoryRiskItems = Number(metrics.inventory.lowStockCount || 0) + Number(metrics.inventory.outOfStockCount || 0);
            const expensesRatio = metrics.sales.totalRevenue > 0 ? (totalExpenses / metrics.sales.totalRevenue) * 100 : 0;
            const actualMargin = metrics.sales.totalRevenue > 0 ? (adjustedNetProfit / metrics.sales.totalRevenue) * 100 : 0;

            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.left = '-99999px';
            element.style.top = '0';
            element.style.width = '1000px';
            element.style.padding = '30px';
            element.style.background = '#ffffff';
            element.style.direction = 'rtl';
            element.style.fontFamily = 'Tahoma, Arial, sans-serif';
            element.style.color = '#0f172a';

            element.innerHTML = `
                <div style="border-bottom: 3px solid #4f46e5; padding-bottom: 14px; margin-bottom: 20px;">
                    <h1 style="margin: 0 0 8px 0; font-size: 30px; color: #4f46e5;">تقرير النظرة العامة الشامل</h1>
                    <div style="font-size: 14px; color: #475569;">الفترة: ${dateRange.startDate} إلى ${dateRange.endDate}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}</div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px;">
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:10px;"><div style="font-size:12px;color:#166534;">إجمالي الإيرادات</div><div style="font-size:18px;font-weight:700;color:#15803d;">${metrics.sales.totalRevenue.toFixed(2)} ج.م</div></div>
                    <div style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:10px; padding:10px;"><div style="font-size:12px;color:#3730a3;">صافي الربح قبل المصروفات</div><div style="font-size:18px;font-weight:700;color:#4338ca;">${metrics.financial.netProfit.toFixed(2)} ج.م</div></div>
                    <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:10px;"><div style="font-size:12px;color:#991b1b;">المصروفات التشغيلية</div><div style="font-size:18px;font-weight:700;color:#dc2626;">${totalExpenses.toFixed(2)} ج.م</div><div style="font-size:11px;color:#7f1d1d;">${totalExpensesCount} مصروف</div></div>
                    <div style="background:${adjustedNetProfit >= 0 ? '#f0fdf4' : '#fef2f2'}; border:1px solid ${adjustedNetProfit >= 0 ? '#bbf7d0' : '#fecaca'}; border-radius:10px; padding:10px;"><div style="font-size:12px;color:${adjustedNetProfit >= 0 ? '#166534' : '#991b1b'};">صافي الربح الفعلي</div><div style="font-size:18px;font-weight:700;color:${adjustedNetProfit >= 0 ? '#16a34a' : '#dc2626'};">${adjustedNetProfit.toFixed(2)} ج.م</div><div style="font-size:11px;color:#475569;">هامش ${actualMargin.toFixed(1)}%</div></div>
                </div>

                <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1e293b;">الملخص المالي للفترة</h2>
                <table style="width:100%; border-collapse:collapse; margin-bottom: 18px;">
                    <tr style="background:#f8fafc;"><th style="border:1px solid #e2e8f0; padding:8px; text-align:right;">البند</th><th style="border:1px solid #e2e8f0; padding:8px; text-align:left;">القيمة</th><th style="border:1px solid #e2e8f0; padding:8px; text-align:left;">النسبة</th></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">صافي المبيعات</td><td style="border:1px solid #e2e8f0; padding:8px;">${metrics.sales.netSales.toFixed(2)} ج.م</td><td style="border:1px solid #e2e8f0; padding:8px;">100%</td></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">تكلفة البضاعة</td><td style="border:1px solid #e2e8f0; padding:8px;">${metrics.financial.totalCost.toFixed(2)} ج.م</td><td style="border:1px solid #e2e8f0; padding:8px;">${safePercent(metrics.financial.totalCost, metrics.sales.totalRevenue)}%</td></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">الضرائب</td><td style="border:1px solid #e2e8f0; padding:8px;">${metrics.financial.totalTax.toFixed(2)} ج.م</td><td style="border:1px solid #e2e8f0; padding:8px;">${safePercent(metrics.financial.totalTax, metrics.sales.totalRevenue)}%</td></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">العمولات</td><td style="border:1px solid #e2e8f0; padding:8px;">${metrics.financial.totalCommission.toFixed(2)} ج.م</td><td style="border:1px solid #e2e8f0; padding:8px;">${safePercent(metrics.financial.totalCommission, metrics.sales.totalRevenue)}%</td></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">المصروفات التشغيلية</td><td style="border:1px solid #e2e8f0; padding:8px; color:#dc2626;">${totalExpenses.toFixed(2)} ج.م</td><td style="border:1px solid #e2e8f0; padding:8px;">${expensesRatio.toFixed(1)}%</td></tr>
                    <tr style="background:#f8fafc;"><td style="border:1px solid #e2e8f0; padding:8px; font-weight:700;">صافي الربح بعد المصروفات</td><td style="border:1px solid #e2e8f0; padding:8px; font-weight:700; color:${adjustedNetProfit >= 0 ? '#16a34a' : '#dc2626'};">${adjustedNetProfit.toFixed(2)} ج.م</td><td style="border:1px solid #e2e8f0; padding:8px; font-weight:700;">${actualMargin.toFixed(1)}%</td></tr>
                </table>

                <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1e293b;">معلومات إضافية مهمة لنفس الفترة</h2>
                <table style="width:100%; border-collapse:collapse; margin-bottom: 18px;">
                    <tr style="background:#f8fafc;"><th style="border:1px solid #e2e8f0; padding:8px; text-align:right;">المؤشر</th><th style="border:1px solid #e2e8f0; padding:8px; text-align:right;">القيمة</th></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">أكثر قناة مبيعات</td><td style="border:1px solid #e2e8f0; padding:8px;">${topChannel ? `${topChannel.channelName || topChannel.channel} (${topChannel.percentage.toFixed(1)}%)` : '-'}</td></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">أعلى منتج بالإيراد</td><td style="border:1px solid #e2e8f0; padding:8px;">${topProduct ? `${topProduct.productName} (${topProduct.revenue.toFixed(2)} ج.م)` : '-'}</td></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">أعلى تصنيف مصروفات</td><td style="border:1px solid #e2e8f0; padding:8px;">${topExpenseCategory ? `${topExpenseCategory.categoryNameAr || topExpenseCategory.categoryName} (${Number(topExpenseCategory.total || 0).toFixed(2)} ج.م)` : 'لا يوجد بيانات مصروفات'}</td></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">نسبة المرتجعات من الإيراد</td><td style="border:1px solid #e2e8f0; padding:8px;">${returnRate.toFixed(2)}%</td></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">ذمم الموردين</td><td style="border:1px solid #e2e8f0; padding:8px; color:#7c3aed;">${suppliersBalance.toFixed(2)} ج.م</td></tr>
                    <tr><td style="border:1px solid #e2e8f0; padding:8px;">منتجات تحتاج متابعة مخزون</td><td style="border:1px solid #e2e8f0; padding:8px; color:${inventoryRiskItems > 0 ? '#d97706' : '#16a34a'};">${inventoryRiskItems} منتج</td></tr>
                </table>

                ${expensesReport?.byCategory?.length > 0 ? `
                <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1e293b;">تفصيل المصروفات حسب التصنيف</h2>
                <table style="width:100%; border-collapse:collapse; margin-bottom: 10px;">
                    <tr style="background:#f8fafc;"><th style="border:1px solid #e2e8f0; padding:8px; text-align:right;">التصنيف</th><th style="border:1px solid #e2e8f0; padding:8px; text-align:center;">العدد</th><th style="border:1px solid #e2e8f0; padding:8px; text-align:left;">الإجمالي</th><th style="border:1px solid #e2e8f0; padding:8px; text-align:left;">النسبة</th></tr>
                    ${(expensesReport.byCategory || []).slice(0, 8).map((cat: any) => `
                        <tr>
                            <td style="border:1px solid #e2e8f0; padding:8px;">${cat.categoryNameAr || cat.categoryName || 'بدون تصنيف'}</td>
                            <td style="border:1px solid #e2e8f0; padding:8px; text-align:center;">${Number(cat.count || 0)}</td>
                            <td style="border:1px solid #e2e8f0; padding:8px;">${Number(cat.total || 0).toFixed(2)} ج.م</td>
                            <td style="border:1px solid #e2e8f0; padding:8px;">${safePercent(Number(cat.total || 0), totalExpenses)}%</td>
                        </tr>
                    `).join('')}
                </table>
                ` : ''}

                <div style="margin-top: 18px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
                    تقرير عربي تلقائي - نظام سحلة
                </div>
            `;

            document.body.appendChild(element);

            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new PDF('p', 'mm', 'a4');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 8;
                const imgWidth = pageWidth - margin * 2;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                let heightLeft = imgHeight;
                let position = margin;

                pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                heightLeft -= (pageHeight - margin * 2);

                while (heightLeft > 0) {
                    pdf.addPage();
                    position = margin - (imgHeight - heightLeft);
                    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                    heightLeft -= (pageHeight - margin * 2);
                }

                pdf.save(`overview-report-${dateRange.startDate}-${dateRange.endDate}.pdf`);
            } catch (err) {
                console.error('PDF Generation Error:', err);
                alert('حدث خطأ أثناء إنشاء ملف PDF');
            } finally {
                document.body.removeChild(element);
            }

        } else {
            const XLSX = await import('xlsx');

            const wb = XLSX.utils.book_new();

            const summaryData = [
                ['Overview Report (Sales + Expenses)'],
                [`الفترة: ${dateRange.startDate} إلى ${dateRange.endDate}`],
                [`تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}`],
                [],
                ['البيان', 'القيمة', 'ملاحظات'],
                ['إجمالي الإيرادات', metrics.sales.totalRevenue.toFixed(2), 'ج.م'],
                ['عدد الفواتير', metrics.sales.orderCount, 'فاتورة'],
                ['متوسط الفاتورة', metrics.sales.averageOrderValue.toFixed(2), 'ج.م'],
                ['المرتجعات', metrics.sales.totalReturns.toFixed(2), 'ج.م'],
                ['صافي المبيعات', metrics.sales.netSales.toFixed(2), 'ج.م'],
                [],
                ['البيانات المالية', '', ''],
                ['التكلفة الإجمالية', metrics.financial.totalCost.toFixed(2), `${((metrics.financial.totalCost / metrics.sales.totalRevenue) * 100).toFixed(1)}% من الإيرادات`],
                ['إجمالي الربح', metrics.financial.grossProfit.toFixed(2), 'ج.م'],
                ['هامش الربح', `${metrics.financial.profitMargin.toFixed(1)}%`, 'نسبة مئوية'],
                ['الضرائب المحصلة', metrics.financial.totalTax.toFixed(2), `${((metrics.financial.totalTax / metrics.sales.totalRevenue) * 100).toFixed(1)}%`],
                ['العمولات والرسوم', metrics.financial.totalCommission.toFixed(2), `${((metrics.financial.totalCommission / metrics.sales.totalRevenue) * 100).toFixed(1)}%`],
                ['صافي الربح (قبل المصروفات التشغيلية)', metrics.financial.netProfit.toFixed(2), 'ج.م'],
                ['المصروفات التشغيلية', totalExpenses.toFixed(2), `${totalExpensesCount} مصروف`],
                ['صافي الربح الفعلي (بعد المصروفات)', adjustedNetProfit.toFixed(2), 'ج.م'],
                ['ذمم الموردين', suppliersBalance.toFixed(2), 'ج.م'],
                [],
                ['المخزون', '', ''],
                ['قيمة المخزون الإجمالية', metrics.inventory.totalStockValue.toFixed(2), 'ج.م'],
                ['عدد المنتجات', metrics.inventory.totalProducts, 'منتج'],
            ];
            const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
            ws1['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 30 }];
            XLSX.utils.book_append_sheet(wb, ws1, 'الملخص التنفيذي');

            const expenseData = [
                ['تفصيل المصروفات والضرائب'],
                [`الفترة: ${dateRange.startDate} إلى ${dateRange.endDate}`],
                [],
                ['نوع المصروف', 'المبلغ (ج.م)', '% من الإيرادات', '% من الربح الإجمالي', 'تفاصيل'],
                [
                    'تكلفة البضاعة المباعة (COGS)',
                    metrics.financial.totalCost.toFixed(2),
                    ((metrics.financial.totalCost / metrics.sales.totalRevenue) * 100).toFixed(2),
                    ((metrics.financial.totalCost / (metrics.financial.grossProfit + metrics.financial.totalCost || 1)) * 100).toFixed(2),
                    'التكلفة المباشرة للمنتجات'
                ],
                [
                    'الضرائب المحصلة',
                    metrics.financial.totalTax.toFixed(2),
                    ((metrics.financial.totalTax / metrics.sales.totalRevenue) * 100).toFixed(2),
                    ((metrics.financial.totalTax / (metrics.financial.grossProfit || 1)) * 100).toFixed(2),
                    'ضريبة القيمة المضافة والضرائب الأخرى'
                ],
                [
                    'العمولات والرسوم',
                    metrics.financial.totalCommission.toFixed(2),
                    ((metrics.financial.totalCommission / metrics.sales.totalRevenue) * 100).toFixed(2),
                    ((metrics.financial.totalCommission / (metrics.financial.grossProfit || 1)) * 100).toFixed(2),
                    'عمولات المنصات والقنوات'
                ],
                [],
                ['إجمالي المصروفات', (metrics.financial.totalCost + metrics.financial.totalTax + metrics.financial.totalCommission).toFixed(2), (((metrics.financial.totalCost + metrics.financial.totalTax + metrics.financial.totalCommission) / metrics.sales.totalRevenue) * 100).toFixed(2), '', ''],
                ['صافي الربح بعد المصروفات', metrics.financial.netProfit.toFixed(2), ((metrics.financial.netProfit / metrics.sales.totalRevenue) * 100).toFixed(2), '100%', 'الربح النهائي'],
                ['صافي الربح الفعلي بعد المصروفات التشغيلية', adjustedNetProfit.toFixed(2), safePercent(adjustedNetProfit, metrics.sales.totalRevenue), 'بعد خصم OpEx', 'المؤشر الأهم'],
            ];
            const ws1a = XLSX.utils.aoa_to_sheet(expenseData);
            ws1a['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 35 }];
            XLSX.utils.book_append_sheet(wb, ws1a, 'تفصيل المصروفات');

            if (expensesReport?.byCategory?.length > 0) {
                const expenseCatData = [
                    ['المصروفات حسب التصنيف'],
                    [`الفترة: ${dateRange.startDate} إلى ${dateRange.endDate}`],
                    [],
                    ['التصنيف', 'عدد المصروفات', 'الإجمالي (ج.م)', '% من إجمالي المصروفات'],
                    ...expensesReport.byCategory.map((cat: any) => [
                        cat.categoryNameAr || cat.categoryName || 'بدون تصنيف',
                        Number(cat.count || 0),
                        Number(cat.total || 0).toFixed(2),
                        `${safePercent(Number(cat.total || 0), totalExpenses)}%`,
                    ]),
                ];
                const wsExpCats = XLSX.utils.aoa_to_sheet(expenseCatData);
                wsExpCats['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 20 }];
                XLSX.utils.book_append_sheet(wb, wsExpCats, 'تصنيفات المصروفات');
            }

            const channelData = [
                ['تحليل المبيعات حسب القناة'],
                [`الفترة: ${dateRange.startDate} إلى ${dateRange.endDate}`],
                [],
                ['القناة', 'عدد الفواتير', 'إجمالي المبيعات (ج.م)', 'النسبة %', 'متوسط الفاتورة', 'أعلى فاتورة', 'أقل فاتورة'],
                ...metrics.performance.salesByChannel.map(ch => [
                    ch.channelName || ch.channel,
                    ch.count,
                    ch.total.toFixed(2),
                    ch.percentage.toFixed(1),
                    (ch.total / ch.count).toFixed(2),
                    '-',
                    '-'
                ]),
                [],
                ['الإجمالي', metrics.sales.orderCount, metrics.sales.totalRevenue.toFixed(2), '100%', metrics.sales.averageOrderValue.toFixed(2), '', '']
            ];
            const ws2 = XLSX.utils.aoa_to_sheet(channelData);
            ws2['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, ws2, 'المبيعات حسب القناة');

            // === TOP PRODUCTS SHEET ===
            const productData = [
                ['تحليل أفضل المنتجات'],
                [`الفترة: ${dateRange.startDate} إلى ${dateRange.endDate}`],
                [],
                ['المنتج', 'الكمية المباعة', 'الإيرادات (ج.م)', 'التكلفة المتوقعة', 'الربح (ج.م)', 'هامش الربح %', 'سعر الوحدة', 'تصنيف الأداء'],
                ...metrics.performance.topProducts.map((p, idx) => [
                    p.productName,
                    p.quantity,
                    p.revenue.toFixed(2),
                    (p.revenue - p.profit).toFixed(2),
                    p.profit.toFixed(2),
                    ((p.profit / (p.revenue || 1)) * 100).toFixed(1),
                    (p.revenue / (p.quantity || 1)).toFixed(2),
                    idx < 3 ? 'ممتاز ⭐' : idx < 7 ? 'جيد ✓' : 'متوسط'
                ]),
                [],
                ['الإجمالي', metrics.performance.topProducts.reduce((sum, p) => sum + p.quantity, 0), metrics.performance.topProducts.reduce((sum, p) => sum + p.revenue, 0).toFixed(2), '', metrics.performance.topProducts.reduce((sum, p) => sum + p.profit, 0).toFixed(2), '', '', '']
            ];
            const ws3 = XLSX.utils.aoa_to_sheet(productData);
            ws3['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, ws3, 'أفضل المنتجات');

            // === PAYMENT METHODS SHEET ===
            const paymentData = [
                ['تفصيل طرق الدفع'],
                [`الفترة: ${dateRange.startDate} إلى ${dateRange.endDate}`],
                [],
                ['طريقة الدفع', 'عدد العمليات', 'إجمالي المبلغ (ج.م)', 'النسبة من الإجمالي %', 'متوسط العملية', 'الحد الأقصى', 'الحد الأدنى'],
                ...metrics.performance.salesByPayment.map(pm => [
                    pm.method,
                    pm.count,
                    pm.total.toFixed(2),
                    ((pm.total / metrics.sales.totalRevenue) * 100).toFixed(1),
                    (pm.total / pm.count).toFixed(2),
                    '-',
                    '-'
                ]),
                [],
                ['الإجمالي', metrics.performance.salesByPayment.reduce((sum, pm) => sum + pm.count, 0), metrics.sales.totalRevenue.toFixed(2), '100%', '', '', '']
            ];
            const ws4 = XLSX.utils.aoa_to_sheet(paymentData);
            ws4['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, ws4, 'طرق الدفع');

            // === SALES BY CATEGORY SHEET ===
            const categoryData = [
                ['مبيعات الأقسام (التصنيفات)'],
                [`الفترة: ${dateRange.startDate} إلى ${dateRange.endDate}`],
                [],
                ['القسم', 'عدد القطع المباعة', 'إجمالي المبيعات (ج.م)', 'متوسط سعر القطعة', 'النسبة من الإجمالي %'],
                ...(metrics.performance.salesByCategory || []).map(cat => [
                    cat.name,
                    cat.count,
                    cat.total.toFixed(2),
                    (cat.total / (cat.count || 1)).toFixed(2),
                    metrics.sales.totalRevenue > 0 ? ((cat.total / metrics.sales.totalRevenue) * 100).toFixed(1) + '%' : '0%'
                ]),
                [],
                ['الإجمالي', (metrics.performance.salesByCategory || []).reduce((sum, c) => sum + c.count, 0), (metrics.performance.salesByCategory || []).reduce((sum, c) => sum + c.total, 0).toFixed(2), '', '100%']
            ];
            const wsCategory = XLSX.utils.aoa_to_sheet(categoryData);
            wsCategory['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, wsCategory, 'مبيعات الأقسام');

            // === HOURLY STATS SHEET ===
            const hourlyData = [
                ['تحليل المبيعات بالساعة'],
                [`الفترة: ${dateRange.startDate} إلى ${dateRange.endDate}`],
                [],
                ['الساعة', 'عدد الفواتير', 'إجمالي المبيعات (ج.م)', 'متوسط الفاتورة', 'نشاط الساعة'],
                ...(metrics.performance.hourlyStats || []).map(h => [
                    h.hour,
                    h.count,
                    h.total.toFixed(2),
                    h.count > 0 ? (h.total / h.count).toFixed(2) : '0.00',
                    h.count > 0 ? 'نشطة' : '-'
                ]),
                [],
                ['الإجمالي', (metrics.performance.hourlyStats || []).reduce((sum, h) => sum + h.count, 0), (metrics.performance.hourlyStats || []).reduce((sum, h) => sum + h.total, 0).toFixed(2), '', '']
            ];
            const wsHourly = XLSX.utils.aoa_to_sheet(hourlyData);
            wsHourly['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, wsHourly, 'النشاط بالساعة');

            // === INVENTORY SHEET ===
            const inventoryData = [
                ['ملخص وتحليل المخزون'],
                [`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`],
                [],
                ['بيان المخزون', 'القيمة', 'النسبة %', 'ملاحظات'],
                ['إجمالي قيمة المخزون', `${metrics.inventory.totalStockValue.toFixed(2)} ج.م`, '100%', 'القيمة الإجمالية للمخزون الحالي'],
                ['إجمالي عدد المنتجات', metrics.inventory.totalProducts.toString(), '100%', 'عدد المنتجات المختلفة'],
                [],
                ['حالة المخزون', '', '', ''],
                ['المخزون الصحي', (metrics.inventory.totalProducts - metrics.inventory.lowStockCount - metrics.inventory.outOfStockCount).toString(), ((((metrics.inventory.totalProducts - metrics.inventory.lowStockCount - metrics.inventory.outOfStockCount) / metrics.inventory.totalProducts) * 100).toFixed(1)), 'متوفر بكميات كافية ✓'],
                ['المخزون المنخفض', metrics.inventory.lowStockCount.toString(), (((metrics.inventory.lowStockCount / metrics.inventory.totalProducts) * 100).toFixed(1)), 'يحتاج إلى تعبئة ⚠'],
                ['نفذ من المخزون', metrics.inventory.outOfStockCount.toString(), (((metrics.inventory.outOfStockCount / metrics.inventory.totalProducts) * 100).toFixed(1)), 'غير متوفر ❌'],
                [],
                ['التنبيهات والإجراءات', '', '', ''],
                ['عدد المنتجات المطلوب تعبئتها', (metrics.inventory.lowStockCount + metrics.inventory.outOfStockCount).toString(), '', 'إجمالي المنتجات التي تحتاج اهتمام'],
                ['نسبة الصحة العامة للمخزون', `${(((metrics.inventory.totalProducts - metrics.inventory.lowStockCount - metrics.inventory.outOfStockCount) / metrics.inventory.totalProducts) * 100).toFixed(1)}%`, '', metrics.inventory.lowStockCount === 0 && metrics.inventory.outOfStockCount === 0 ? 'ممتاز ⭐⭐⭐' : metrics.inventory.lowStockCount < 5 ? 'جيد ✓' : 'يحتاج تحسين ⚠'],
            ];
            const ws5 = XLSX.utils.aoa_to_sheet(inventoryData);
            ws5['!cols'] = [{ wch: 35 }, { wch: 22 }, { wch: 15 }, { wch: 35 }];
            XLSX.utils.book_append_sheet(wb, ws5, 'تحليل المخزون');

            // === FINANCIAL RATIOS SHEET ===
            const ratiosData = [
                ['النسب والمؤشرات المالية'],
                [`الفترة: ${dateRange.startDate} إلى ${dateRange.endDate}`],
                [],
                ['المؤشر المالي', 'القيمة', 'المعيار', 'الحالة'],
                ['هامش الربح الإجمالي', `${metrics.financial.profitMargin.toFixed(1)}%`, '> 20%', metrics.financial.profitMargin > 20 ? 'جيد ✓' : 'يحتاج تحسين'],
                ['هامش الربح الصافي', `${((metrics.financial.netProfit / metrics.sales.totalRevenue) * 100).toFixed(1)}%`, '> 10%', ((metrics.financial.netProfit / metrics.sales.totalRevenue) * 100) > 10 ? 'جيد ✓' : 'منخفض'],
                ['نسبة التكلفة إلى الإيرادات', `${((metrics.financial.totalCost / metrics.sales.totalRevenue) * 100).toFixed(1)}%`, '< 70%', ((metrics.financial.totalCost / metrics.sales.totalRevenue) * 100) < 70 ? 'جيد ✓' : 'مرتفع'],
                ['نسبة الضرائب', `${((metrics.financial.totalTax / metrics.sales.totalRevenue) * 100).toFixed(1)}%`, '', 'معلومات'],
                ['نسبة العمولات', `${((metrics.financial.totalCommission / metrics.sales.totalRevenue) * 100).toFixed(1)}%`, '< 10%', ((metrics.financial.totalCommission / metrics.sales.totalRevenue) * 100) < 10 ? 'جيد ✓' : 'مرتفع'],
                ['متوسط قيمة الفاتورة', `${metrics.sales.averageOrderValue.toFixed(2)} ج.م`, '', 'معلومات'],
                ['معدل دوران المخزون', `${((metrics.sales.totalRevenue / metrics.inventory.totalStockValue) || 0).toFixed(2)} مرة`, '> 4', 'معلومات'],
            ];
            const ws6 = XLSX.utils.aoa_to_sheet(ratiosData);
            ws6['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 15 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws6, 'النسب المالية');

            XLSX.writeFile(wb, `overview-report-${dateRange.startDate}-${dateRange.endDate}.xlsx`);
        }
    };

    const StatCard = ({ title, value, change, icon: Icon, color, subtitle }: any) => (
        <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500', marginBottom: '8px' }}>{title}</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{value}</div>
                    {subtitle && <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{subtitle}</div>}
                </div>
                <div style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
                }}>
                    <Icon size={24} color={color} strokeWidth={2.5} />
                </div>
            </div>
            {change !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: change >= 0 ? '#dcfce7' : '#fee2e2',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: change >= 0 ? '#16a34a' : '#dc2626'
                    }}>
                        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>مقارنة بالفترة السابقة</span>
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <RefreshCw size={48} color="#6366f1" className="spin" />
                <p style={{ marginTop: '16px', fontSize: '16px', color: '#64748b' }}>جاري تحميل التقارير...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                padding: '32px',
                marginBottom: '32px',
                color: 'white',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <BarChart3 size={36} />
                            لوحة التقارير والتحليلات
                        </h1>
                        <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>
                            تحليل شامل لأداء النظام من {dateRange.startDate} إلى {dateRange.endDate}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => handleExport('excel')}
                            style={{
                                padding: '12px 20px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                        >
                            <FileText size={18} /> Excel
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            style={{
                                padding: '12px 20px',
                                background: 'rgba(255, 255, 255, 0.9)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#667eea',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                fontWeight: '700',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'white'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'}
                        >
                            <Download size={18} /> تصدير PDF
                        </button>
                    </div>
                </div>

                {/* Date Filter Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[
                        { fn: getToday, label: 'اليوم' },
                        { fn: getYesterday, label: 'أمس' },
                        { fn: getThisWeek, label: 'هذا الأسبوع' },
                        { fn: getThisMonth, label: 'هذا الشهر' }
                    ].map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => setDateRange(preset.fn())}
                            style={{
                                padding: '10px 18px',
                                background: dateRange.label === preset.label
                                    ? 'rgba(255, 255, 255, 0.95)'
                                    : 'rgba(255, 255, 255, 0.15)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '10px',
                                color: dateRange.label === preset.label ? '#667eea' : 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Calendar size={16} />
                            {preset.label}
                        </button>
                    ))}
                    <button
                        onClick={fetchReports}
                        style={{
                            padding: '10px 18px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '10px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <RefreshCw size={16} />
                        تحديث
                    </button>
                    <button
                        onClick={() => setShowCustomDateRange(!showCustomDateRange)}
                        style={{
                            padding: '10px 18px',
                            background: showCustomDateRange
                                ? 'rgba(255, 255, 255, 0.95)'
                                : 'rgba(255, 255, 255, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '10px',
                            color: showCustomDateRange ? '#667eea' : 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Calendar size={16} />
                        تاريخ مخصص
                    </button>
                </div>

                {/* Custom Date Range Picker */}
                {showCustomDateRange && (
                    <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    opacity: 0.9
                                }}>
                                    من تاريخ
                                </label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        fontSize: '14px',
                                        color: '#667eea',
                                        fontWeight: '600'
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    opacity: 0.9
                                }}>
                                    إلى تاريخ
                                </label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        fontSize: '14px',
                                        color: '#667eea',
                                        fontWeight: '600'
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleCustomDateRange}
                                disabled={!customStartDate || !customEndDate}
                                style={{
                                    padding: '10px 20px',
                                    background: customStartDate && customEndDate
                                        ? 'rgba(255, 255, 255, 0.95)'
                                        : 'rgba(255, 255, 255, 0.3)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#667eea',
                                    cursor: customStartDate && customEndDate ? 'pointer' : 'not-allowed',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                تطبيق
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                background: 'white',
                padding: '8px',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
                {[
                    { id: 'overview', label: 'نظرة عامة', icon: Activity },
                    { id: 'sales', label: 'المبيعات', icon: TrendingUp },
                    { id: 'financial', label: 'التحليل المالي', icon: DollarSign },
                    { id: 'inventory', label: 'المخزون', icon: Package },
                    { id: 'expenses', label: 'المصروفات', icon: Wallet }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            flex: 1,
                            padding: '14px 20px',
                            background: activeTab === tab.id
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : 'transparent',
                            border: 'none',
                            borderRadius: '12px',
                            color: activeTab === tab.id ? 'white' : '#64748b',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: '600',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && metrics && (
                <>
                    {/* KPI Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '32px'
                    }}>
                        <StatCard
                            title="إجمالي المبيعات"
                            value={`${metrics.sales.totalRevenue.toFixed(2)} ج.م`}
                            subtitle={`${metrics.sales.orderCount} فاتورة`}
                            icon={DollarSign}
                            color="#10b981"
                            change={metrics.comparison?.changes.revenueChange}
                        />
                        <StatCard
                            title="صافي الربح"
                            value={`${metrics.financial.netProfit.toFixed(2)} ج.م`}
                            subtitle={`هامش ${metrics.financial.profitMargin.toFixed(1)}%`}
                            icon={TrendingUp}
                            color="#6366f1"
                            change={metrics.comparison?.changes.profitChange}
                        />
                        <StatCard
                            title="المصروفات التشغيلية"
                            value={`${Number(expensesReport?.totalExpenses || 0).toFixed(2)} ج.م`}
                            subtitle={`${Number(expensesReport?.totalCount || 0)} مصروف`}
                            icon={Wallet}
                            color="#dc2626"
                        />
                        <StatCard
                            title="الربح الفعلي بعد المصروفات"
                            value={`${(metrics.financial.netProfit - Number(expensesReport?.totalExpenses || 0)).toFixed(2)} ج.م`}
                            subtitle={`ذمم الموردين: ${Number(suppliersReport?.totalBalance || 0).toFixed(2)} ج.م`}
                            icon={CreditCard}
                            color={(metrics.financial.netProfit - Number(expensesReport?.totalExpenses || 0)) >= 0 ? '#10b981' : '#dc2626'}
                        />
                        <StatCard
                            title="قيمة المخزون"
                            value={`${metrics.inventory.totalStockValue.toFixed(2)} ج.م`}
                            subtitle={`${metrics.inventory.totalProducts} منتج`}
                            icon={Package}
                            color="#f59e0b"
                        />
                        <StatCard
                            title="متوسط الفاتورة"
                            value={`${metrics.sales.averageOrderValue.toFixed(2)} ج.م`}
                            subtitle="لكل عملية بيع"
                            icon={Target}
                            color="#8b5cf6"
                            change={metrics.comparison?.changes.orderChange}
                        />
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                        {/* Top Products */}
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <ShoppingBag size={24} color="#6366f1" />
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>أكثر المنتجات مبيعاً</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {metrics.performance.topProducts.slice(0, 5).map((product, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        background: '#f8fafc',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                                                {product.productName}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                الكمية: {product.quantity}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: '700', color: '#10b981', fontSize: '15px' }}>
                                                {product.revenue.toFixed(2)} ج.م
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6366f1' }}>
                                                ربح: {product.profit.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sales by Channel */}
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <PieChart size={24} color="#f59e0b" />
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>المبيعات حسب القناة</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {metrics.performance.salesByChannel.map((channel, i) => (
                                    <div key={i} style={{ marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: '600', color: '#0f172a' }}>{channel.channelName || channel.channel}</span>
                                            <span style={{ fontWeight: '700', color: '#6366f1' }}>
                                                {channel.total.toFixed(2)} ج.م ({channel.percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div style={{
                                            height: '8px',
                                            background: '#e2e8f0',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.min(channel.percentage, 100)}%`,
                                                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                            {channel.count} فاتورة
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ✅ NEW: Detailed Platform Sales Section */}
                    {platformSales && platformSales.platforms.length > 0 && (
                        <div style={{ marginTop: '32px' }}>
                            {/* Section Header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '16px',
                                padding: '24px',
                                marginBottom: '24px',
                                color: 'white',
                                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <Activity size={28} />
                                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>تحليل المبيعات التفصيلي حسب المنصات</h2>
                                        </div>
                                        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                                            {platformSales.platformCount} منصة نشطة • {platformSales.summary.orderCount} فاتورة
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>
                                            {platformSales.summary.netRevenue.toFixed(2)} ج.م
                                        </div>
                                        <div style={{ fontSize: '13px', opacity: 0.9 }}>صافي الإيرادات</div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                                marginBottom: '24px'
                            }}>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    border: '2px solid #10b981'
                                }}>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>إجمالي الربح</div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                                        {platformSales.summary.grossProfit.toFixed(2)} ج.م
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                        هامش {platformSales.summary.avgProfitMargin.toFixed(1)}%
                                    </div>
                                </div>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    border: '2px solid #6366f1'
                                }}>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>صافي الربح</div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>
                                        {platformSales.summary.netProfit.toFixed(2)} ج.م
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                        بعد العمولات والضرائب
                                    </div>
                                </div>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    border: '2px solid #f59e0b'
                                }}>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>إجمالي العمولات</div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                                        {platformSales.summary.commission.toFixed(2)} ج.م
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                        رسوم المنصات
                                    </div>
                                </div>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    border: '2px solid #ef4444'
                                }}>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>المرتجعات</div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                                        {platformSales.summary.refunded.toFixed(2)} ج.م
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                        من {platformSales.summary.grossRevenue.toFixed(2)} ج.م
                                    </div>
                                </div>
                            </div>

                            {/* Platform Cards */}
                            <div style={{ display: 'grid', gap: '20px' }}>
                                {platformSales.platforms.map((platform, index) => {
                                    const change = platformSales.comparison?.platformChanges.find(
                                        c => c.platform === platform.platform
                                    );

                                    return (
                                        <div key={platform.platform} style={{
                                            background: 'white',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                            border: index === 0 ? '2px solid #667eea' : '1px solid #e2e8f0',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            {index === 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    color: 'white',
                                                    padding: '6px 16px',
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    borderBottomLeftRadius: '12px'
                                                }}>
                                                    الأعلى أداءً 🏆
                                                </div>
                                            )}

                                            {/* Platform Header */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{
                                                        fontSize: '48px',
                                                        lineHeight: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '70px',
                                                        height: '70px',
                                                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                                        borderRadius: '16px',
                                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                                    }}>
                                                        {platform.platformIcon}
                                                    </div>
                                                    <div>
                                                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                                                            {platform.platformName}
                                                        </h3>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                padding: '4px 10px',
                                                                background: platform.isActive ? '#10b98120' : '#ef444420',
                                                                color: platform.isActive ? '#10b981' : '#ef4444',
                                                                borderRadius: '6px',
                                                                fontWeight: '600'
                                                            }}>
                                                                {platform.isActive ? 'نشط' : 'غير نشط'}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                padding: '4px 10px',
                                                                background: '#6366f120',
                                                                color: '#6366f1',
                                                                borderRadius: '6px',
                                                                fontWeight: '600'
                                                            }}>
                                                                {platform.orderCount} فاتورة
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea', marginBottom: '4px' }}>
                                                        {platform.netRevenue.toFixed(2)} ج.م
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                        {platform.revenuePercentage.toFixed(1)}% من الإجمالي
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                                gap: '16px',
                                                marginBottom: '20px'
                                            }}>
                                                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>إجمالي الإيرادات</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                                                        {platform.grossRevenue.toFixed(2)} ج.م
                                                    </div>
                                                </div>
                                                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>إجمالي الربح</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                                                        {platform.grossProfit.toFixed(2)} ج.م
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                                        هامش {platform.profitMargin.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>صافي الربح</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1' }}>
                                                        {platform.netProfit.toFixed(2)} ج.م
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                                        هامش {platform.netProfitMargin.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '12px', border: '1px solid #fde68a' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>متوسط الفاتورة</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#d97706' }}>
                                                        {platform.avgOrderValue.toFixed(2)} ج.م
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                                        ربح: {platform.avgProfit.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Costs & Fees Row */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                                gap: '12px',
                                                padding: '16px',
                                                background: '#fef2f2',
                                                borderRadius: '12px',
                                                marginBottom: '16px'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>تكلفة البضاعة</div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                                                        {platform.costOfGoods.toFixed(2)} ج.م
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>العمولة</div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b' }}>
                                                        {platform.commission.toFixed(2)} ج.م
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                                                        {platform.actualCommissionRate.toFixed(2)}% (قياسي: {platform.configuredCommissionRate.toFixed(2)}%)
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>الضريبة</div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#ef4444' }}>
                                                        {platform.tax.toFixed(2)} ج.م
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                                                        {platform.actualTaxRate.toFixed(2)}% (قياسي: {platform.configuredTaxRate.toFixed(2)}%)
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>المرتجعات</div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#dc2626' }}>
                                                        {platform.refunded.toFixed(2)} ج.م
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                                                        معدل {platform.refundRate.toFixed(2)}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Period Comparison */}
                                            {change && (
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '12px',
                                                    padding: '12px 16px',
                                                    background: change.isNew ? '#ecfdf5' : '#f8fafc',
                                                    borderRadius: '10px',
                                                    border: change.isNew ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                                                }}>
                                                    {change.isNew ? (
                                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>
                                                            ✨ منصة جديدة في هذه الفترة
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>تغير الإيرادات</div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    fontSize: '14px',
                                                                    fontWeight: '700',
                                                                    color: change.revenueChange >= 0 ? '#10b981' : '#ef4444'
                                                                }}>
                                                                    {change.revenueChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                                    {Math.abs(change.revenueChange).toFixed(1)}%
                                                                </div>
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>تغير الربح</div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    fontSize: '14px',
                                                                    fontWeight: '700',
                                                                    color: change.profitChange >= 0 ? '#10b981' : '#ef4444'
                                                                }}>
                                                                    {change.profitChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                                    {Math.abs(change.profitChange).toFixed(1)}%
                                                                </div>
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>تغير الطلبات</div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    fontSize: '14px',
                                                                    fontWeight: '700',
                                                                    color: change.orderChange >= 0 ? '#10b981' : '#ef4444'
                                                                }}>
                                                                    {change.orderChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                                    {Math.abs(change.orderChange).toFixed(1)}%
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* NEW: Customer Analytics & Returns Analysis Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
                        {/* Customer Analytics */}
                        {metrics.customers && (
                            <div style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '24px',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <Users size={24} color="#8b5cf6" />
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>تحليل العملاء</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#6366f1' }}>{metrics.customers.totalCustomers}</div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>إجمالي العملاء</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{metrics.customers.registeredSales}</div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>مبيعات مسجلة</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#475569' }}>أفضل العملاء:</div>
                                {metrics.customers.topCustomers.slice(0, 3).map((customer, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        background: i === 0 ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : '#f8fafc',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        border: i === 0 ? '1px solid #fbbf24' : '1px solid #e2e8f0'
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: '600', color: '#0f172a' }}>{customer.name}</span>
                                            <span style={{ fontSize: '12px', color: '#64748b', marginRight: '8px' }}>({customer.orderCount} طلب)</span>
                                        </div>
                                        <div style={{ fontWeight: '700', color: '#10b981' }}>{customer.totalRevenue.toFixed(0)} ج.م</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Returns Analysis */}
                        {metrics.returns && (
                            <div style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '24px',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <TrendingDown size={24} color="#ef4444" />
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>تحليل المرتجعات</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ textAlign: 'center', padding: '12px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#dc2626' }}>{metrics.returns.totalReturnsCount}</div>
                                        <div style={{ fontSize: '12px', color: '#991b1b' }}>عدد المرتجعات</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '12px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#dc2626' }}>{metrics.returns.totalReturnsValue.toFixed(0)}</div>
                                        <div style={{ fontSize: '12px', color: '#991b1b' }}>قيمة المرتجعات</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '12px', background: metrics.returns.returnRate > 5 ? '#fef2f2' : '#f0fdf4', borderRadius: '12px', border: `1px solid ${metrics.returns.returnRate > 5 ? '#fecaca' : '#bbf7d0'}` }}>
                                        <div style={{ fontSize: '22px', fontWeight: '700', color: metrics.returns.returnRate > 5 ? '#dc2626' : '#16a34a' }}>{metrics.returns.returnRate}%</div>
                                        <div style={{ fontSize: '12px', color: metrics.returns.returnRate > 5 ? '#991b1b' : '#166534' }}>نسبة المرتجعات</div>
                                    </div>
                                </div>
                                {metrics.returns.returnsByType.length > 0 && (
                                    <>
                                        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#475569' }}>حسب النوع:</div>
                                        {metrics.returns.returnsByType.map((rt, i) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                background: '#f8fafc',
                                                borderRadius: '8px',
                                                marginBottom: '8px',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                                    {rt.type === 'STOCK' ? '🔄 إرجاع للمخزون' : '⚠️ تالف'}
                                                </span>
                                                <div>
                                                    <span style={{ fontWeight: '600', color: '#64748b' }}>{rt.qty} قطعة</span>
                                                    <span style={{ marginRight: '12px', fontWeight: '700', color: '#dc2626' }}>{rt.value.toFixed(0)} ج.م</span>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Alerts Section */}
                    {(metrics.inventory.lowStockCount > 0 || metrics.inventory.outOfStockCount > 0) && (
                        <div style={{
                            marginTop: '24px',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '2px solid #fbbf24'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <AlertTriangle size={24} color="#d97706" />
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#92400e' }}>
                                    تنبيهات المخزون
                                </h3>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1, padding: '16px', background: 'white', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>
                                        مخزون منخفض
                                    </div>
                                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#d97706' }}>
                                        {metrics.inventory.lowStockCount}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px' }}>
                                        منتج يحتاج تعبئة
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: '16px', background: 'white', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>
                                        نفذ من المخزون
                                    </div>
                                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>
                                        {metrics.inventory.outOfStockCount}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px' }}>
                                        منتج غير متوفر
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Sales Tab */}
            {activeTab === 'sales' && metrics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <StatCard
                        title="إجمالي الإيرادات"
                        value={`${metrics.sales.totalRevenue.toFixed(2)} ج.م`}
                        subtitle={`${metrics.sales.orderCount} فاتورة`}
                        icon={DollarSign}
                        color="#10b981"
                    />
                    <StatCard
                        title="متوسط الفاتورة"
                        value={`${metrics.sales.averageOrderValue.toFixed(2)} ج.م`}
                        icon={Target}
                        color="#8b5cf6"
                    />
                    <StatCard
                        title="المرتجعات"
                        value={`${metrics.sales.totalReturns.toFixed(2)} ج.م`}
                        icon={TrendingDown}
                        color="#ef4444"
                    />
                    <StatCard
                        title="صافي المبيعات"
                        value={`${metrics.sales.netSales.toFixed(2)} ج.م`}
                        icon={TrendingUp}
                        color="#6366f1"
                    />
                </div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && metrics && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <StatCard
                            title="إجمالي الربح"
                            value={`${metrics.financial.grossProfit.toFixed(2)} ج.م`}
                            subtitle={`هامش ${metrics.financial.profitMargin.toFixed(1)}%`}
                            icon={TrendingUp}
                            color="#10b981"
                        />
                        <StatCard
                            title="التكلفة الإجمالية"
                            value={`${metrics.financial.totalCost.toFixed(2)} ج.م`}
                            icon={DollarSign}
                            color="#ef4444"
                        />
                        <StatCard
                            title="الضرائب"
                            value={`${metrics.financial.totalTax.toFixed(2)} ج.م`}
                            icon={FileText}
                            color="#f59e0b"
                        />
                        <StatCard
                            title="العمولات"
                            value={`${metrics.financial.totalCommission.toFixed(2)} ج.م`}
                            icon={Users}
                            color="#8b5cf6"
                        />
                        <StatCard
                            title="صافي الربح (قبل المصروفات)"
                            value={`${metrics.financial.netProfit.toFixed(2)} ج.م`}
                            icon={TrendingUp}
                            color="#6366f1"
                        />
                        {expensesReport && (
                            <StatCard
                                title="المصروفات التشغيلية"
                                value={`${Number(expensesReport.totalExpenses).toFixed(2)} ج.م`}
                                subtitle={`${expensesReport.totalCount} مصروف`}
                                icon={Wallet}
                                color="#dc2626"
                            />
                        )}
                        {expensesReport && (
                            <StatCard
                                title="الربح الحقيقي النهائي"
                                value={`${(metrics.financial.netProfit - Number(expensesReport.totalExpenses)).toFixed(2)} ج.م`}
                                subtitle="بعد خصم المصروفات التشغيلية"
                                icon={TrendingDown}
                                color={(metrics.financial.netProfit - Number(expensesReport.totalExpenses)) >= 0 ? '#10b981' : '#dc2626'}
                            />
                        )}
                    </div>

                    {expensesReport && expensesReport.byCategory && expensesReport.byCategory.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <Wallet size={20} color="#dc2626" />
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>توزيع المصروفات التشغيلية</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {expensesReport.byCategory.map((cat: any, i: number) => (
                                    <div key={i} style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}30`, borderRadius: '12px', padding: '12px 16px', minWidth: '150px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }} />
                                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '13px' }}>{cat.categoryNameAr || cat.categoryName}</span>
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: '700', color: cat.color }}>{Number(cat.total).toFixed(2)} ج.م</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{cat.count} مصروف</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {suppliersReport && (
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <CreditCard size={20} color="#8b5cf6" />
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>ذمم الموردين</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                                {[
                                    { label: 'إجمالي الفواتير', value: Number(suppliersReport.totalInvoiced).toFixed(2) + ' ج.م', color: '#3b82f6' },
                                    { label: 'المدفوع', value: Number(suppliersReport.totalPaid).toFixed(2) + ' ج.م', color: '#10b981' },
                                    { label: 'الرصيد المستحق', value: Number(suppliersReport.totalBalance).toFixed(2) + ' ج.م', color: '#dc2626' },
                                    { label: 'موردون لهم رصيد', value: String(suppliersReport.suppliersWithBalance), color: '#f59e0b' },
                                ].map((item, i) => (
                                    <div key={i} style={{ background: `${item.color}10`, borderRadius: '10px', padding: '14px', border: `1px solid ${item.color}25` }}>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{item.label}</div>
                                        <div style={{ fontSize: '18px', fontWeight: '700', color: item.color }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {!expensesReport ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                            <p>جاري تحميل بيانات المصروفات...</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                <StatCard title="إجمالي المصروفات" value={`${Number(expensesReport.totalExpenses).toFixed(2)} ج.م`}
                                    subtitle={`${expensesReport.totalCount} مصروف`} icon={Wallet} color="#dc2626" />
                                <StatCard title="مصروفات اليوم" value={`${Number(expensesReport.todayExpenses).toFixed(2)} ج.م`}
                                    subtitle={`${expensesReport.todayCount} مصروف`} icon={Receipt} color="#f97316" />
                                <StatCard title="مصروفات الشهر" value={`${Number(expensesReport.monthExpenses).toFixed(2)} ج.م`}
                                    subtitle={`${expensesReport.monthCount} مصروف`} icon={Calendar} color="#3b82f6" />
                                <StatCard title="مصروفات متكررة" value={expensesReport.recurringCount} subtitle="اشتراك شهري" icon={TrendingDown} color="#8b5cf6" />
                                {metrics && <StatCard title="المصروفات من الربح"
                                    value={metrics.financial.netProfit > 0 ? `${((Number(expensesReport.totalExpenses) / metrics.financial.netProfit) * 100).toFixed(1)}%` : '-'}
                                    subtitle="نسبة من صافي الربح" icon={PieChart} color="#f59e0b" />}
                                {metrics && <StatCard title="الربح الحقيقي النهائي"
                                    value={`${(metrics.financial.netProfit - Number(expensesReport.totalExpenses)).toFixed(2)} ج.م`}
                                    subtitle="بعد المصروفات التشغيلية" icon={TrendingUp}
                                    color={(metrics.financial.netProfit - Number(expensesReport.totalExpenses)) >= 0 ? '#10b981' : '#dc2626'} />}
                            </div>

                            {expensesReport.byCategory && expensesReport.byCategory.length > 0 && (
                                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <Tag size={18} color="#6366f1" />
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>المصروفات حسب التصنيف</h3>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '12px', textAlign: 'right', color: '#475569', fontWeight: '600' }}>التصنيف</th>
                                                <th style={{ padding: '12px', textAlign: 'right', color: '#475569', fontWeight: '600' }}>عدد المصروفات</th>
                                                <th style={{ padding: '12px', textAlign: 'right', color: '#475569', fontWeight: '600' }}>الإجمالي</th>
                                                <th style={{ padding: '12px', textAlign: 'right', color: '#475569', fontWeight: '600' }}>النسبة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expensesReport.byCategory.map((cat: any, i: number) => {
                                                const pct = expensesReport.totalExpenses > 0 ? ((Number(cat.total) / Number(expensesReport.totalExpenses)) * 100).toFixed(1) : '0';
                                                return (
                                                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: cat.color }} />
                                                                <span style={{ fontWeight: '500', color: '#374151' }}>{cat.categoryNameAr || cat.categoryName}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '12px', color: '#64748b' }}>{cat.count}</td>
                                                        <td style={{ padding: '12px', fontWeight: '700', color: '#dc2626' }}>{Number(cat.total).toFixed(2)} ج.م</td>
                                                        <td style={{ padding: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                                                                    <div style={{ width: `${pct}%`, height: '100%', background: cat.color, borderRadius: '3px' }} />
                                                                </div>
                                                                <span style={{ fontSize: '13px', color: '#64748b', width: '40px' }}>{pct}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {expensesReport.byPaymentMethod && expensesReport.byPaymentMethod.length > 0 && (
                                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <CreditCard size={18} color="#3b82f6" />
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>المصروفات حسب طريقة الدفع</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        {expensesReport.byPaymentMethod.map((pm: any, i: number) => {
                                            const ml: Record<string, { label: string; color: string }> = { CASH: { label: 'كاش', color: '#16a34a' }, CARD: { label: 'بطاقة', color: '#3b82f6' }, TRANSFER: { label: 'تحويل', color: '#8b5cf6' }, INSTAPAY: { label: 'انستاباي', color: '#ec4899' }, FAWRY: { label: 'فوري', color: '#f97316' }, WALLET: { label: 'محفظة', color: '#14b8a6' } };
                                            const m = ml[pm.method] || { label: pm.method, color: '#6b7280' };
                                            return (
                                                <div key={i} style={{ background: `${m.color}10`, border: `1px solid ${m.color}30`, borderRadius: '12px', padding: '14px 20px', minWidth: '130px' }}>
                                                    <div style={{ fontWeight: '600', color: m.color, marginBottom: '4px' }}>{m.label}</div>
                                                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{Number(pm.total).toFixed(2)} ج.م</div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{pm.count} عملية</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {suppliersReport && (
                                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <Banknote size={18} color="#8b5cf6" />
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>ذمم الموردين</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                                        {[
                                            { label: 'إجمالي الفواتير', value: Number(suppliersReport.totalInvoiced).toFixed(2) + ' ج.م', color: '#3b82f6' },
                                            { label: 'المدفوع للموردين', value: Number(suppliersReport.totalPaid).toFixed(2) + ' ج.م', color: '#10b981' },
                                            { label: 'الرصيد المستحق', value: Number(suppliersReport.totalBalance).toFixed(2) + ' ج.م', color: '#dc2626' },
                                            { label: 'موردون نشطون', value: suppliersReport.activeSuppliers + ' / ' + suppliersReport.totalSuppliers, color: '#f59e0b' },
                                        ].map((item, i) => (
                                            <div key={i} style={{ background: `${item.color}10`, borderRadius: '10px', padding: '14px', border: `1px solid ${item.color}25` }}>
                                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{item.label}</div>
                                                <div style={{ fontSize: '18px', fontWeight: '700', color: item.color }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && metrics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <StatCard
                        title="قيمة المخزون"
                        value={`${metrics.inventory.totalStockValue.toFixed(2)} ج.م`}
                        icon={Package}
                        color="#6366f1"
                    />
                    <StatCard
                        title="عدد المنتجات"
                        value={metrics.inventory.totalProducts.toString()}
                        subtitle="منتج مختلف"
                        icon={ShoppingBag}
                        color="#10b981"
                    />
                    <StatCard
                        title="مخزون منخفض"
                        value={metrics.inventory.lowStockCount.toString()}
                        subtitle="يحتاج تعبئة"
                        icon={AlertTriangle}
                        color="#f59e0b"
                    />
                    <StatCard
                        title="نفذ من المخزون"
                        value={metrics.inventory.outOfStockCount.toString()}
                        subtitle="غير متوفر"
                        icon={AlertTriangle}
                        color="#ef4444"
                    />
                </div>
            )}
        </div>
    );
}
