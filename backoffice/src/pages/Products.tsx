import { useState, useEffect } from 'react';
import { Clock, Edit, Trash, Plus, Search, Filter, TrendingUp, Download, Globe, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import ExcelJS from 'exceljs';
import ProductForm from './ProductForm';
import ProductAuditHistory from './ProductAuditHistory';
import ProductTransactions from './ProductTransactions';
import apiClient from '../api/client';
import { getFirstProductImageUrl, loadExportImage } from '../utils/export-image';

interface Product {
    id: number;
    code: string;
    barcode: string;
    nameEn: string;
    nameAr: string;
    brand: string;
    unit: string;
    costAvg?: number;
    cost: number;
    priceRetail: number;
    priceWholesale: number;
    minQty: number;
    maxQty: number;
    active: boolean;
    categoryId: number | null;
    itemTypeId: number | null;
    category: any;
    itemType: any;
    stock: number;
    images?: string[];
}

interface Category {
    id: number;
    name: string;
    nameAr: string;
    subcategories: Subcategory[];
}

interface Subcategory {
    id: number;
    name: string;
    nameAr: string;
    categoryId?: number;
    itemTypes: ItemType[];
}

interface ItemType {
    id: number;
    name: string;
    nameAr: string;
    subcategoryId?: number;
    categoryId?: number;
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userPerms = (currentUser.permissions || []);
    const isAdmin = (currentUser.roles || []).some((r: string) => r === 'ADMIN');
    const canCreate = isAdmin || userPerms.includes('products:create');
    const canEdit = isAdmin || userPerms.includes('products:edit');
    const canDelete = isAdmin || userPerms.includes('products:delete');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
    const [selectedItemType, setSelectedItemType] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [allProductsTotal, setAllProductsTotal] = useState(0);
    const [showAuditHistory, setShowAuditHistory] = useState(false);
    const [selectedProductForAudit, setSelectedProductForAudit] = useState<any>(null);
    const [showTransactions, setShowTransactions] = useState(false);
    const [selectedProductForTransactions, setSelectedProductForTransactions] = useState<any>(null);
    const [showInactive, setShowInactive] = useState(false);
    const [stockFilter, setStockFilter] = useState<string>('');
    const [hasImageFilter, setHasImageFilter] = useState<string>('');
    const [reservedItems, setReservedItems] = useState<any[]>([]);
    const [reservedLoading, setReservedLoading] = useState(false);
    const [showReserved, setShowReserved] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isReservedExporting, setIsReservedExporting] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchAllTotal();
    }, [searchTerm, selectedCategory, selectedSubcategory, selectedItemType, page, showInactive, stockFilter, hasImageFilter]);

    const fetchAllTotal = async () => {
        try {
            const res = await apiClient.get('/products', { params: { take: 1, active: true } });
            if (res.data.total) setAllProductsTotal(res.data.total);
        } catch { /* ignore */ }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params: any = {
                skip: (page - 1) * 50,
                take: 50,
            };

            if (searchTerm) params.search = searchTerm;
            if (selectedCategory) params.categoryId = selectedCategory;
            if (selectedSubcategory) params.subcategoryId = selectedSubcategory;
            if (selectedItemType) params.itemTypeId = selectedItemType;

            if (!showInactive) params.active = true;

            // ✅ NEW: Pass stock filter to backend
            if (stockFilter) {
                params.stockStatus = stockFilter;
            }
            if (hasImageFilter) {
                params.hasImage = hasImageFilter === 'yes' ? 'true' : 'false';
            }

            const response = await apiClient.get('/products', { params });

            // ✅ FIXED: Use backend results directly (no client-side filtering)
            setProducts(response.data.data);
            setTotalPages(Math.ceil(response.data.total / 50));
            setTotalCount(response.data.total);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await apiClient.get('/products/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchReservedStock = async () => {
        setReservedLoading(true);
        try {
            const response = await apiClient.get('/stock/reserved');
            setReservedItems(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch reserved stock:', error);
        } finally {
            setReservedLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

        try {
            await apiClient.delete(`/products/${id}`);
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete product:', error);
            alert('فشل حذف المنتج');
        }
    };

    const handleReactivate = async (id: number) => {
        try {
            await apiClient.patch(`/products/${id}`, { active: true });
            fetchProducts();
        } catch (error) {
            console.error('Failed to reactivate product:', error);
            alert('فشل تفعيل المنتج');
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingProduct(null);
        fetchProducts();
    };

    const findSubcategoryById = (id: number) => {
        for (const cat of categories) {
            const sub = cat.subcategories?.find((s) => s.id === id);
            if (sub) return { ...sub, categoryId: cat.id, categoryName: cat.nameAr || cat.name };
        }
        return null;
    };

    const findItemTypeById = (id: number) => {
        for (const cat of categories) {
            for (const sub of cat.subcategories || []) {
                const item = sub.itemTypes?.find((t) => t.id === id);
                if (item) {
                    return {
                        ...item,
                        subcategoryId: sub.id,
                        subcategoryName: sub.nameAr || sub.name,
                        categoryId: cat.id,
                        categoryName: cat.nameAr || cat.name,
                    };
                }
            }
        }
        return null;
    };

    const getSubcategories = (): Array<Subcategory & { categoryId: number; categoryName: string }> => {
        if (selectedCategory) {
            const category = categories.find((c) => c.id === selectedCategory);
            return (category?.subcategories || []).map((sub) => ({
                ...sub,
                categoryId: selectedCategory,
                categoryName: category?.nameAr || category?.name || '',
            }));
        }
        return categories.flatMap((cat) =>
            (cat.subcategories || []).map((sub) => ({
                ...sub,
                categoryId: cat.id,
                categoryName: cat.nameAr || cat.name,
            })),
        );
    };

    const getItemTypes = (): Array<ItemType & { subcategoryId: number; subcategoryName: string; categoryId: number; categoryName: string }> => {
        if (selectedSubcategory) {
            const sub = findSubcategoryById(selectedSubcategory);
            return (sub?.itemTypes || []).map((item) => ({
                ...item,
                subcategoryId: selectedSubcategory,
                subcategoryName: sub?.nameAr || sub?.name || '',
                categoryId: sub?.categoryId || 0,
                categoryName: sub?.categoryName || '',
            }));
        }
        if (selectedCategory) {
            const category = categories.find((c) => c.id === selectedCategory);
            return (category?.subcategories || []).flatMap((sub) =>
                (sub.itemTypes || []).map((item) => ({
                    ...item,
                    subcategoryId: sub.id,
                    subcategoryName: sub.nameAr || sub.name,
                    categoryId: selectedCategory,
                    categoryName: category?.nameAr || category?.name || '',
                })),
            );
        }
        return categories.flatMap((cat) =>
            (cat.subcategories || []).flatMap((sub) =>
                (sub.itemTypes || []).map((item) => ({
                    ...item,
                    subcategoryId: sub.id,
                    subcategoryName: sub.nameAr || sub.name,
                    categoryId: cat.id,
                    categoryName: cat.nameAr || cat.name,
                })),
            ),
        );
    };

    const hasActiveFilters = searchTerm || selectedCategory || selectedSubcategory || selectedItemType || stockFilter || hasImageFilter;

    const exportToExcel = async () => {
        setIsExporting(true);
        try {
            const params: any = { take: 10000 };
            if (searchTerm) params.search = searchTerm;
            if (selectedCategory) params.categoryId = selectedCategory;
            if (selectedSubcategory) params.subcategoryId = selectedSubcategory;
            if (selectedItemType) params.itemTypeId = selectedItemType;
            if (stockFilter) params.stockStatus = stockFilter;
            if (hasImageFilter) {
                params.hasImage = hasImageFilter === 'yes' ? 'true' : 'false';
            }

            const response = await apiClient.get('/products', { params });
            const allProducts = response.data.data || response.data || [];

            const imageResults = await Promise.all(
                allProducts.map((p: any) => loadExportImage(getFirstProductImageUrl(p.images))),
            );

            const trunc = (val: any, max = 32767) => {
                const s = String(val ?? '');
                return s.length > max ? s.slice(0, max) : s;
            };

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('المنتجات');

            worksheet.columns = [
                { header: 'صورة المنتج', key: 'img', width: 18 },
                { header: 'الكود', key: 'code', width: 12 },
                { header: 'الاسم العربي', key: 'nameAr', width: 30 },
                { header: 'الاسم الانجليزي', key: 'nameEn', width: 25 },
                { header: 'الباركود', key: 'barcode', width: 16 },
                { header: 'الماركة', key: 'brand', width: 14 },
                { header: 'الوحدة', key: 'unit', width: 8 },
                { header: 'التصنيف', key: 'category', width: 14 },
                { header: 'التصنيف الفرعي', key: 'subcategory', width: 16 },
                { header: 'نوع المنتج', key: 'itemType', width: 14 },
                { header: 'سعر التجزئة', key: 'priceRetail', width: 14 },
                { header: 'سعر الجملة', key: 'priceWholesale', width: 14 },
                { header: 'التكلفة', key: 'cost', width: 12 },
                { header: 'متوسط التكلفة', key: 'costAvg', width: 14 },
                { header: 'الكمية في المخزن', key: 'stock', width: 16 },
                { header: 'الحد الأدنى', key: 'minQty', width: 10 },
                { header: 'الحد الأقصى', key: 'maxQty', width: 10 },
                { header: 'حالة المخزون', key: 'stockStatus', width: 14 },
                { header: 'الحالة', key: 'status', width: 10 },
            ];

            for (let i = 0; i < allProducts.length; i++) {
                const p = allProducts[i];
                const stock = p.stock || 0;
                let stockStatus = 'جيد';
                if (stock <= 0) stockStatus = 'نافذ';
                else if (stock <= (p.minQty || 5)) stockStatus = 'منخفض';
                else if (p.maxQty > 0 && stock >= p.maxQty) stockStatus = 'زائد';

                const category = p.category?.nameAr || p.category?.name || p.itemType?.subcategory?.category?.nameAr || p.itemType?.subcategory?.category?.name || '';
                const subcategory = p.itemType?.subcategory?.nameAr || p.itemType?.subcategory?.name || '';
                const itemType = p.itemType?.nameAr || p.itemType?.name || '';

                const row = worksheet.addRow({
                    img: '',
                    code: trunc(p.code),
                    nameAr: trunc(p.nameAr),
                    nameEn: trunc(p.nameEn),
                    barcode: trunc(p.barcode),
                    brand: trunc(p.brand),
                    unit: trunc(p.unit),
                    category: trunc(category),
                    subcategory: trunc(subcategory),
                    itemType: trunc(itemType),
                    priceRetail: Number(p.priceRetail || 0),
                    priceWholesale: Number(p.priceWholesale || 0),
                    cost: Number(p.cost || 0),
                    costAvg: Number(p.costAvg || 0),
                    stock: stock,
                    minQty: p.minQty || 0,
                    maxQty: p.maxQty || 0,
                    stockStatus: stockStatus,
                    status: p.active ? 'نشط' : 'غير نشط',
                });

                const img = imageResults[i];
                if (img) {
                    const imageId = workbook.addImage({ buffer: img.buffer, extension: img.ext });
                    worksheet.addImage(imageId, {
                        tl: { col: 0, row: row.number - 1 },
                        ext: { width: 80, height: 80 },
                    });
                    row.height = 80;
                }
            }

            const buf = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            a.download = `products-${date}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('فشل تصدير البيانات');
        } finally {
            setIsExporting(false);
        }
    };

    const exportReservedToExcel = async () => {
        setIsReservedExporting(true);
        try {
            const response = await apiClient.get('/stock/reserved');
            const items = response.data.data || [];

            const imageResults = await Promise.all(
                items.map((item: any) => loadExportImage(getFirstProductImageUrl(item.productImages))),
            );

            const workbook = new ExcelJS.Workbook();

            // Sheet 1: Reserved items summary
            const ws1 = workbook.addWorksheet('المحجوزات');

            ws1.columns = [
                { header: 'صورة المنتج', key: 'img', width: 18 },
                { header: 'المنتج (عربي)', key: 'nameAr', width: 25 },
                { header: 'المنتج (إنجليزي)', key: 'nameEn', width: 25 },
                { header: 'الكود', key: 'code', width: 15 },
                { header: 'الباركود', key: 'barcode', width: 18 },
                { header: 'الوحدة', key: 'unit', width: 10 },
                { header: 'الماركة', key: 'brand', width: 15 },
                { header: 'التصنيف', key: 'category', width: 18 },
                { header: 'نوع الصنف', key: 'itemType', width: 18 },
                { header: 'سعر التجزئة', key: 'retailPrice', width: 14 },
                { header: 'سعر الجملة', key: 'wholesalePrice', width: 14 },
                { header: 'الكمية المحجوزة', key: 'qty', width: 16 },
                { header: 'رقم الفاتورة', key: 'invoice', width: 18 },
                { header: 'قناة الطلب', key: 'channel', width: 14 },
                { header: 'حالة الطلب', key: 'status', width: 16 },
                { header: 'طريقة الدفع', key: 'payment', width: 14 },
                { header: 'رسوم الشحن', key: 'shipping', width: 12 },
                { header: 'إجمالي الفاتورة', key: 'total', width: 16 },
                { header: 'عنوان التوصيل', key: 'deliveryAddress', width: 35 },
                { header: 'تاريخ الحجز', key: 'date', width: 16 },
                { header: 'تاريخ التوصيل', key: 'deliveryDate', width: 16 },
                { header: 'العميل', key: 'customerName', width: 22 },
                { header: 'هاتف العميل', key: 'customerPhone', width: 18 },
                { header: 'عنوان العميل', key: 'customerAddress', width: 35 },
                { header: 'نوع العميل', key: 'customerType', width: 14 },
                { header: 'ملاحظات الفاتورة', key: 'notes', width: 30 },
            ];

            const parseDeliveryAddress = (notes: string | null): { address: string; restNotes: string } => {
                if (!notes) return { address: '—', restNotes: '' };
                const parts = notes.split('|').map(s => s.trim()).filter(Boolean);
                const zonePart = parts.find(p => /منطقة التوصيل/i.test(p));
                const addressParts = zonePart ? parts.slice(parts.indexOf(zonePart)) : [];
                const address = addressParts.length > 0 ? addressParts.join(' | ') : notes;
                const restNotes = zonePart ? parts.slice(0, parts.indexOf(zonePart)).join(' | ') : '';
                return { address: address || '—', restNotes: restNotes || '—' };
            };
            const statusMap: Record<string, string> = {
                PENDING: 'قيد الانتظار',
                CONFIRMED: 'مؤكد',
                SHIPPED: 'تم الشحن',
                DELIVERED: 'تم التوصيل',
                CANCELLED: 'ملغي',
            };
            const paymentMethodMap: Record<string, string> = {
                CASH: 'نقدي',
                CARD: 'بطاقة',
                TRANSFER: 'تحويل',
                MIXED: 'مختلط',
                INSTAPAY: 'انستاباي',
                FAWRY: 'فوري',
                WALLET: 'محفظة',
            };

            ws1.getRow(1).height = 25;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const { address, restNotes } = parseDeliveryAddress(item.invoiceNotes);
                const row = ws1.addRow({
                    img: '',
                    nameAr: item.productNameAr || '—',
                    nameEn: item.productNameEn || '—',
                    code: item.productCode || '',
                    barcode: item.barcode || '—',
                    unit: item.productUnit || '—',
                    brand: item.productBrand || '—',
                    category: item.categoryNameAr || item.categoryName || '—',
                    itemType: item.itemTypeNameAr || item.itemTypeName || '—',
                    retailPrice: item.productPriceRetail ?? '—',
                    wholesalePrice: item.productPriceWholesale ?? '—',
                    qty: item.reservedQty || 0,
                    invoice: item.invoiceNo || `#${item.invoiceId}`,
                    channel: item.orderChannel || '—',
                    status: statusMap[item.orderStatus] || item.orderStatus || '—',
                    payment: paymentMethodMap[item.paymentMethod] || item.paymentMethod || '—',
                    shipping: item.shippingFee ?? '—',
                    total: item.invoiceTotal ?? '—',
                    deliveryAddress: address,
                    date: item.reservedAt ? new Date(item.reservedAt).toLocaleDateString('ar-EG') : '—',
                    deliveryDate: item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('ar-EG') : '—',
                    customerName: item.customerName || '—',
                    customerPhone: item.customerPhone || '—',
                    customerAddress: item.customerAddress || '—',
                    customerType: item.customerType === 'WHOLESALE' ? 'جملة' : item.customerType === 'RETAIL' ? 'تجزئة' : item.customerType || '—',
                    notes: restNotes,
                });

                const img = imageResults[i];
                if (img) {
                    const imageId = workbook.addImage({ buffer: img.buffer, extension: img.ext });
                    ws1.addImage(imageId, {
                        tl: { col: 0, row: row.number - 1 },
                        ext: { width: 80, height: 80 },
                    });
                    row.height = 80;
                }
            }

            // Sheet 2: Invoice lines detail
            const ws2 = workbook.addWorksheet('تفاصيل الفواتير');

            ws2.columns = [
                { header: 'رقم الفاتورة', key: 'invoiceNo', width: 18 },
                { header: 'المنتج', key: 'product', width: 28 },
                { header: 'الكود', key: 'code', width: 15 },
                { header: 'الكمية', key: 'qty', width: 10 },
                { header: 'سعر الوحدة', key: 'price', width: 14 },
                { header: 'الإجمالي', key: 'total', width: 14 },
                { header: 'نوع السعر', key: 'priceType', width: 14 },
                { header: 'العميل', key: 'customer', width: 22 },
            ];

            const invCustomerMap: Record<number, string> = {};
            items.forEach((item: any) => {
                if (item.invoiceId) invCustomerMap[item.invoiceId] = item.customerName || '—';
            });

            items.forEach((item: any) => {
                const lines: any[] = item.lines || [];
                const invoiceLabel = item.invoiceNo || `#${item.invoiceId}`;
                if (lines.length === 0) {
                    ws2.addRow({
                        invoiceNo: invoiceLabel,
                        product: item.productNameAr || item.productNameEn || '',
                        code: item.productCode || '',
                        qty: item.reservedQty || 0,
                        price: '—',
                        total: '—',
                        priceType: '—',
                        customer: invCustomerMap[item.invoiceId] || '—',
                    });
                } else {
                    lines.forEach((line: any) => {
                        ws2.addRow({
                            invoiceNo: invoiceLabel,
                            product: line.productNameAr || line.productNameEn || '',
                            code: line.productCode || '',
                            qty: line.qty || 0,
                            price: line.unitPrice ?? '—',
                            total: line.lineTotal ?? '—',
                            priceType: line.priceType || '—',
                            customer: invCustomerMap[item.invoiceId] || '—',
                        });
                    });
                }
            });

            // Sheet 3: Customer summary
            const customerMap: Record<number, any> = {};
            items.forEach((item: any) => {
                if (item.customerId && !customerMap[item.customerId]) {
                    customerMap[item.customerId] = {
                        name: item.customerName || '—',
                        phone: item.customerPhone || '—',
                        address: item.customerAddress || '—',
                        type: item.customerType === 'WHOLESALE' ? 'جملة' : item.customerType === 'RETAIL' ? 'تجزئة' : item.customerType || '—',
                        invoices: new Set<string>(),
                    };
                }
                if (item.customerId && customerMap[item.customerId]) {
                    customerMap[item.customerId].invoices.add(item.invoiceNo || `#${item.invoiceId}`);
                }
            });

            const ws3 = workbook.addWorksheet('العملاء');

            ws3.columns = [
                { header: 'اسم العميل', key: 'name', width: 25 },
                { header: 'الهاتف', key: 'phone', width: 18 },
                { header: 'العنوان', key: 'address', width: 40 },
                { header: 'النوع', key: 'type', width: 12 },
                { header: 'عدد الفواتير', key: 'invoiceCount', width: 14 },
            ];

            Object.values(customerMap).forEach((c: any) => {
                ws3.addRow({
                    name: c.name,
                    phone: c.phone,
                    address: c.address,
                    type: c.type,
                    invoiceCount: c.invoices.size,
                });
            });

            const buf = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reserved-stock-${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export reserved failed:', err);
            alert('فشل تصدير المحجوزات');
        } finally {
            setIsReservedExporting(false);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
            }}>
                <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold' }}>
                    جميع المنتجات
                    <span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b', marginRight: '0.75rem' }}>
                        ({allProductsTotal} منتج)
                    </span>
                </h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: isExporting ? '#6ee7b7' : '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isExporting ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '1rem',
                        opacity: isExporting ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => { if (!isExporting) e.currentTarget.style.background = '#047857'; }}
                    onMouseLeave={(e) => { if (!isExporting) e.currentTarget.style.background = '#059669'; }}
                >
                    {isExporting ? <Loader size={20} className="animate-spin" /> : <Download size={20} />}
                    {isExporting ? 'جاري التصدير...' : 'تصدير Excel'}
                </button>
                {canCreate && (
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setShowForm(true);
                        }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1rem',
                        }}
                    >
                        <Plus size={20} />
                        إضافة منتج
                    </button>
                )}
                </div>
            </div>

            {/* Enhanced Filters */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
                {/* Main Filters Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="بحث (الاسم، الباركود، الكود)"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem 2.5rem 0.75rem 1rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        {searchTerm && (
                            <span style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: '#667eea',
                                color: 'white',
                                borderRadius: '10px',
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                            }}>
                                ✓
                            </span>
                        )}
                    </div>

                    {/* Category Filter */}
                    <div style={{ position: 'relative' }}>
                        <Filter
                            size={18}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: selectedCategory ? '#667eea' : '#9ca3af',
                            }}
                        />
                        <select
                            value={selectedCategory || ''}
                            onChange={(e) => {
                                const newCategoryId = e.target.value ? Number(e.target.value) : null;
                                setSelectedCategory(newCategoryId);
                                if (newCategoryId && selectedSubcategory) {
                                    const sub = findSubcategoryById(selectedSubcategory);
                                    if (sub && sub.categoryId !== newCategoryId) {
                                        setSelectedSubcategory(null);
                                        setSelectedItemType(null);
                                    }
                                }
                                setPage(1);
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem 2.5rem 0.75rem 1rem',
                                border: selectedCategory ? '2px solid #667eea' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                background: 'white',
                                transition: 'all 0.2s',
                                fontWeight: selectedCategory ? '600' : 'normal',
                            }}
                        >
                            <option value="">كل الفئات</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nameAr || cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory Filter */}
                    <div style={{ position: 'relative' }}>
                        <Filter
                            size={18}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: selectedSubcategory ? '#667eea' : '#9ca3af',
                            }}
                        />
                        <select
                            value={selectedSubcategory || ''}
                            onChange={(e) => {
                                const newSubId = e.target.value ? Number(e.target.value) : null;
                                setSelectedSubcategory(newSubId);
                                if (newSubId) {
                                    const sub = findSubcategoryById(newSubId);
                                    if (sub) setSelectedCategory(sub.categoryId);
                                    if (selectedItemType) {
                                        const item = findItemTypeById(selectedItemType);
                                        if (item && item.subcategoryId !== newSubId) {
                                            setSelectedItemType(null);
                                        }
                                    }
                                }
                                setPage(1);
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem 2.5rem 0.75rem 1rem',
                                border: selectedSubcategory ? '2px solid #667eea' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                background: 'white',
                                transition: 'all 0.2s',
                                fontWeight: selectedSubcategory ? '600' : 'normal',
                            }}
                        >
                            <option value="">كل الفئات الفرعية</option>
                            {getSubcategories().map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {selectedCategory
                                        ? sub.nameAr || sub.name
                                        : `${sub.categoryName} → ${sub.nameAr || sub.name}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Item Type Filter */}
                    <div style={{ position: 'relative' }}>
                        <Filter
                            size={18}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: selectedItemType ? '#667eea' : '#9ca3af',
                            }}
                        />
                        <select
                            value={selectedItemType || ''}
                            onChange={(e) => {
                                const newItemTypeId = e.target.value ? Number(e.target.value) : null;
                                setSelectedItemType(newItemTypeId);
                                if (newItemTypeId) {
                                    const item = findItemTypeById(newItemTypeId);
                                    if (item) {
                                        setSelectedSubcategory(item.subcategoryId);
                                        setSelectedCategory(item.categoryId);
                                    }
                                }
                                setPage(1);
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem 2.5rem 0.75rem 1rem',
                                border: selectedItemType ? '2px solid #667eea' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                background: 'white',
                                transition: 'all 0.2s',
                                fontWeight: selectedItemType ? '600' : 'normal',
                            }}
                        >
                            <option value="">كل الأصناف</option>
                            {getItemTypes().map((item) => (
                                <option key={item.id} value={item.id}>
                                    {selectedSubcategory
                                        ? item.nameAr || item.name
                                        : selectedCategory
                                          ? `${item.subcategoryName} → ${item.nameAr || item.name}`
                                          : `${item.categoryName} → ${item.subcategoryName} → ${item.nameAr || item.name}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stock Level Filter */}
                    <div style={{ position: 'relative' }}>
                        <Filter
                            size={18}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: stockFilter ? '#667eea' : '#9ca3af'
                            }}
                        />
                        <select
                            value={stockFilter}
                            onChange={(e) => {
                                setStockFilter(e.target.value);
                                setPage(1);
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem 2.5rem 0.75rem 1rem',
                                border: stockFilter ? '2px solid #667eea' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                background: 'white',
                                transition: 'all 0.2s',
                                fontWeight: stockFilter ? 600 : 'normal'
                            }}
                        >
                            <option value="">كل المخزون</option>
                            <option value="available">متاح (&gt; 0)</option>
                            <option value="empty">نافذ (0)</option>
                            <option value="low">منخفض (&lt;= الحد الأدنى)</option>
                            <option value="enough">كافي (بين الحدود)</option>
                            <option value="high">مرتفع (&gt;= الحد الأقصى)</option>
                        </select>
                    </div>

                    {/* Has Image Filter */}
                    <div style={{ position: 'relative' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hasImageFilter ? '#667eea' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <select
                            value={hasImageFilter}
                            onChange={(e) => {
                                setHasImageFilter(e.target.value);
                                setPage(1);
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem 2.5rem 0.75rem 1rem',
                                border: hasImageFilter ? '2px solid #667eea' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                background: 'white',
                                transition: 'all 0.2s',
                                fontWeight: hasImageFilter ? 600 : 'normal'
                            }}
                        >
                            <option value="">كل الصور</option>
                            <option value="yes">بها صورة</option>
                            <option value="no">بدون صورة</option>
                        </select>
                    </div>

                </div>

                {/* Filter Actions Row */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}>
                    {/* Show Inactive Products Toggle */}
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        background: showInactive ? '#f0f4ff' : '#f9fafb',
                        borderRadius: '8px',
                        border: showInactive ? '2px solid #667eea' : '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        userSelect: 'none',
                    }}
                        onMouseEnter={(e) => {
                            if (!showInactive) {
                                e.currentTarget.style.background = '#f3f4f6';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!showInactive) {
                                e.currentTarget.style.background = '#f9fafb';
                            }
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                accentColor: '#667eea',
                            }}
                        />
                        <span style={{
                            fontSize: '0.875rem',
                            fontWeight: showInactive ? '600' : 'normal',
                            color: showInactive ? '#667eea' : '#374151',
                        }}>
                            عرض المنتجات غير النشطة
                        </span>
                        {showInactive && (
                            <span style={{
                                background: '#667eea',
                                color: 'white',
                                borderRadius: '10px',
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                            }}>
                                ON
                            </span>
                        )}
                    </label>

                    {/* Active Filters Badge */}
                    {hasActiveFilters && (
                        <>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: '#fef3c7',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                color: '#92400e',
                                fontWeight: '600',
                            }}>
                                <Filter size={14} />
                                <span>فلاتر نشطة</span>
                            </div>

                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory(null);
                                    setSelectedSubcategory(null);
                                    setSelectedItemType(null);
                                    setStockFilter('');
                                    setHasImageFilter('');
                                    setShowInactive(false);
                                    setPage(1);
                                }}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: '#fee2e2',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    color: '#991b1b',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#fecaca';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#fee2e2';
                                }}
                            >
                                ✕ مسح الفلاتر
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Reserved Stock Section */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden',
            }}>
                {/* Toggle Header */}
                <div
                    onClick={() => {
                        if (!showReserved) fetchReservedStock();
                        setShowReserved(!showReserved);
                    }}
                    style={{
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        background: showReserved ? '#f0f4ff' : 'white',
                        borderBottom: showReserved ? '1px solid #e5e7eb' : 'none',
                        transition: 'all 0.2s',
                        userSelect: 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = showReserved ? '#f0f4ff' : 'white'}
                >
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: '#fef3c7', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#b45309',
                    }}>
                        <Globe size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                            محجوز عن طريق المتجر الإلكتروني
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {showReserved
                                ? `${reservedItems.length} منتج محجوز${reservedItems.length !== 1 ? '' : ''}`
                                : 'اضغط لعرض المنتجات المحجوزة من طلبات المتجر الإلكتروني'
                            }
                        </div>
                    </div>
                    {showReserved && (
                        <button
                            onClick={(e) => { e.stopPropagation(); exportReservedToExcel(); }}
                            disabled={isReservedExporting}
                            title={isReservedExporting ? 'جاري التصدير...' : 'تصدير Excel'}
                            style={{
                                padding: '6px 12px',
                                background: isReservedExporting ? '#6ee7b7' : '#059669',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isReservedExporting ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                opacity: isReservedExporting ? 0.7 : 1,
                            }}
                        >
                            <Download size={14} />
                            {isReservedExporting ? '...' : 'Excel'}
                        </button>
                    )}
                    <div style={{ color: '#94a3b8' }}>
                        {showReserved ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>

                {/* Expanded Content */}
                {showReserved && (
                    <div>
                        {reservedLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                جاري التحميل...
                            </div>
                        ) : reservedItems.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                                <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>لا يوجد منتجات محجوزة حالياً</div>
                                <div style={{ fontSize: '0.875rem' }}>المنتجات المحجوزة عن طريق المتجر الإلكتروني ستظهر هنا</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>المنتج</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>الكود</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>الكمية المحجوزة</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>رقم الفاتورة</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>العميل</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>حالة الطلب</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>تاريخ الحجز</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reservedItems.map((item, index) => (
                                            <tr key={`${item.invoiceId}-${item.productId}`}
                                                style={{ borderBottom: index < reservedItems.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.productNameAr || item.productNameEn}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{item.productCode}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700,
                                                        background: '#fef3c7', color: '#b45309',
                                                    }}>
                                                        {item.reservedQty}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.78rem', color: '#6366f1', fontWeight: 600 }}>
                                                    {item.invoiceNo || `#${item.invoiceId}`}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                                                    {item.customerName || '—'}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block',
                                                        background: item.orderStatus === 'PENDING' ? '#fef3c7' : item.orderStatus === 'CONFIRMED' ? '#dbeafe' : item.orderStatus === 'SHIPPED' ? '#ede9fe' : '#e2e8f0',
                                                        color: item.orderStatus === 'PENDING' ? '#b45309' : item.orderStatus === 'CONFIRMED' ? '#1d4ed8' : item.orderStatus === 'SHIPPED' ? '#6d28d9' : '#475569',
                                                    }}>
                                                        {item.orderStatus === 'PENDING' ? 'قيد الانتظار' : item.orderStatus === 'CONFIRMED' ? 'مؤكد' : item.orderStatus === 'SHIPPED' ? 'تم الشحن' : item.orderStatus || '—'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                                                    {item.reservedAt ? new Date(item.reservedAt).toLocaleDateString('ar-EG') : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Products Table */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                        جاري التحميل...
                    </div>
                ) : products.length === 0 ? (
                    <div style={{
                        padding: '3rem',
                        textAlign: 'center',
                        color: '#9ca3af',
                    }}>
                        <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                            {hasActiveFilters ? 'لا توجد منتجات مطابقة للبحث' : 'لا توجد منتجات'}
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>
                            {hasActiveFilters ? 'حاول تغيير معايير البحث' : 'ابدأ بإضافة منتجات جديدة'}
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.85rem',
                            color: '#64748b',
                            borderBottom: '1px solid #e5e7eb',
                            background: '#fafafa',
                        }}>
                            إجمالي <strong style={{ color: '#1e293b' }}>{totalCount}</strong> من أصل <strong style={{ color: '#1e293b' }}>{allProductsTotal}</strong> منتج
                            {hasActiveFilters && (
                                <span style={{ marginRight: '0.5rem', color: '#f59e0b' }}>(فلاتر نشطة)</span>
                            )}
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', color: '#374151', width: '50px' }}>
                                        الصورة
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                                        الكود
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                                        الاسم
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                                        الباركود
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                                        سعر القطاعي
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                                        سعر الجملة
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                                        التكلفة
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                                        الكمية
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                                        الحالة
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                                        إجراءات
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => {
                                    const stock = product.stock || 0;
                                    const isLowStock = stock > 0 && stock <= product.minQty;
                                    const isOutOfStock = stock <= 0;

                                    return (
                                        <tr
                                            key={product.id}
                                            style={{
                                                borderBottom: '1px solid #e5e7eb',
                                                transition: 'background 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            <td style={{ padding: '0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <div style={{ width: '64px', height: '64px', margin: '0 auto', position: 'relative' }}>
                                                    {product.images?.[0] ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt=""
                                                            style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                const el = (e.target as HTMLImageElement).nextElementSibling;
                                                                if (el) (el as HTMLElement).style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div style={{
                                                        width: '64px', height: '64px', borderRadius: '8px',
                                                        background: 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%)',
                                                        display: product.images?.[0] ? 'none' : 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '22px', color: '#94a3b8', fontWeight: '700',
                                                    }}>
                                                        ?
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                    {product.code}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '500', color: '#111827' }}>
                                                    {product.nameAr || product.nameEn}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                    {product.nameEn}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                    {product.barcode}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ fontWeight: '600', color: '#059669' }}>
                                                    {Number(product.priceRetail).toFixed(2)} ج.م
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ fontWeight: '600', color: '#7c3aed' }}>
                                                    {Number(product.priceWholesale).toFixed(2)} ج.م
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ fontWeight: '600', color: '#111827' }}>
                                                    {Number(product.costAvg || product.cost || 0).toFixed(2)} ج.م
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                                    آخر شراء: {Number(product.cost || 0).toFixed(2)}
                                                </div>
                                            </td>

                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    background: isOutOfStock ? '#fee2e2' : isLowStock ? '#fef3c7' : '#dcfce7',
                                                    color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#16a34a',
                                                }}>
                                                    {stock} {product.unit}
                                                    {isLowStock && !isOutOfStock && (
                                                        <span style={{ fontSize: '0.75rem' }}>قليل</span>
                                                    )}
                                                    {isOutOfStock && (
                                                        <span style={{ fontSize: '0.75rem' }}>نفذ</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '500',
                                                    background: product.active ? '#dcfce7' : '#fee2e2',
                                                    color: product.active ? '#16a34a' : '#dc2626',
                                                }}>
                                                    {product.active ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProductForAudit(product);
                                                            setShowAuditHistory(true);
                                                        }}
                                                        title="سجل التعديلات"
                                                        style={{
                                                            padding: '0.5rem',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#8b5cf6',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Clock size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedProductForTransactions(product);
                                                            setShowTransactions(true);
                                                        }}
                                                        title="حركات المخزون"
                                                        style={{
                                                            padding: '0.5rem',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#3b82f6',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <TrendingUp size={18} />
                                                    </button>

                                                    {canEdit && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingProduct(product);
                                                                setShowForm(true);
                                                            }}
                                                            title="تعديل"
                                                            style={{
                                                                padding: '0.5rem',
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#6366f1',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                    )}

                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            title="حذف"
                                                            style={{
                                                                padding: '0.5rem',
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#ef4444',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            <Trash size={18} />
                                                        </button>
                                                    )}
                                                    {!product.active && (
                                                        <button
                                                            onClick={() => handleReactivate(product.id)}
                                                            style={{
                                                                padding: '0.5rem',
                                                                background: '#10b981',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '0.375rem',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem',
                                                            }}
                                                            title="تفعيل"
                                                        >
                                                            ✓ تفعيل
                                                        </button>
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                padding: '1rem',
                                borderTop: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '0.5rem',
                            }}>
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        background: page === 1 ? '#f3f4f6' : 'white',
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    السابق
                                </button>
                                <div style={{ padding: '0.5rem 1rem', color: '#6b7280' }}>
                                    صفحة {page} من {totalPages}
                                </div>
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        background: page === totalPages ? '#f3f4f6' : 'white',
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    التالي
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showForm && (
                <ProductForm
                    product={editingProduct}
                    onClose={handleFormClose}
                    onSave={() => {
                        handleFormClose();
                        fetchProducts();
                    }}
                />
            )}

            {showAuditHistory && selectedProductForAudit && (
                <ProductAuditHistory
                    productId={selectedProductForAudit.id}
                    productName={selectedProductForAudit.nameAr || selectedProductForAudit.nameEn}
                    onClose={() => {
                        setShowAuditHistory(false);
                        setSelectedProductForAudit(null);
                    }}
                />
            )}

            {showTransactions && selectedProductForTransactions && (
                <ProductTransactions
                    product={selectedProductForTransactions}
                    onClose={() => {
                        setShowTransactions(false);
                        setSelectedProductForTransactions(null);
                    }}
                />
            )}

        </div>
    );
}