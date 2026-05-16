import { useState, useEffect } from 'react';
import { Warehouse, Search, Package, AlertTriangle } from 'lucide-react';
import apiClient from '../api/client';
import './CommonStyles.css';

interface StockItem {
    product: {
        id: number;
        code: string;
        nameAr?: string;
        nameEn: string;
        barcode?: string;
        unit?: string;
        minQty?: number;
    };
    stockLocation: {
        id: number;
        name: string;
        branch: { name: string };
    };
    onHandQty: number;
}

export default function Stock() {
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStock();
    }, []);

    const fetchStock = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/stock/on-hand');
            setStockItems(data);
        } catch (e) {
            setError('فشل تحميل بيانات المخزون');
        } finally {
            setLoading(false);
        }
    };

    const filtered = stockItems.filter(item => {
        const term = search.toLowerCase();
        return (
            item.product.nameAr?.includes(search) ||
            item.product.nameEn?.toLowerCase().includes(term) ||
            item.product.code?.toLowerCase().includes(term) ||
            item.product.barcode?.includes(search) ||
            item.stockLocation.name?.toLowerCase().includes(term)
        );
    });

    const lowStock = filtered.filter(item => item.product.minQty != null && item.onHandQty < (item.product.minQty ?? 0));

    return (
        <div style={{ padding: '24px', direction: 'rtl' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Warehouse size={28} color="#3b82f6" />
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>المخزون</h1>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#3b82f6', marginBottom: '4px' }}>إجمالي الأصناف</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stockItems.length}</div>
                </div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>تحت الحد الأدنى</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{lowStock.length}</div>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="بحث بالاسم أو الكود أو الباركود..."
                    style={{ width: '100%', padding: '10px 36px 10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
            </div>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', color: '#dc2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>جاري التحميل...</div>
            ) : (
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>المنتج</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>الكود</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>الموقع</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>الفرع</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>الكمية</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                        <Package size={40} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                                        لا توجد بيانات
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item, idx) => {
                                    const isLow = item.product.minQty != null && item.onHandQty < (item.product.minQty ?? 0);
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', background: isLow ? '#fff7f7' : 'white' }}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: '500' }}>{item.product.nameAr || item.product.nameEn}</div>
                                                {item.product.barcode && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{item.product.barcode}</div>}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.product.code}</td>
                                            <td style={{ padding: '12px 16px' }}>{item.stockLocation.name}</td>
                                            <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.stockLocation.branch?.name}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>
                                                {item.onHandQty} {item.product.unit || ''}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                {isLow ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                                        <AlertTriangle size={12} /> منخفض
                                                    </span>
                                                ) : (
                                                    <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                                        جيد
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
