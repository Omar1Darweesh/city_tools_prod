import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import {
    Database, Download, Trash2, RefreshCw, CheckCircle,
    AlertCircle, Loader2, HardDrive, Clock, Shield, Zap
} from 'lucide-react';

interface BackupInfo {
    filename: string;
    type: 'manual' | 'automatic';
    date: string;
    size: number;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function Backup() {
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [creating, setCreating] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchBackups = useCallback(async () => {
        setLoadingList(true);
        try {
            const { data } = await apiClient.get<BackupInfo[]>('/database/backups');
            setBackups(data);
        } catch {
            showToast('error', 'تعذّر تحميل قائمة النسخ الاحتياطية');
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { fetchBackups(); }, [fetchBackups]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            await apiClient.post('/database/backup');
            showToast('success', 'تم إنشاء النسخة الاحتياطية بنجاح');
            fetchBackups();
        } catch {
            showToast('error', 'فشل إنشاء النسخة الاحتياطية');
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (filename: string) => {
        setDownloadingFile(filename);
        try {
            const response = await apiClient.get('/database/backup/download', {
                params: { filename },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            showToast('error', 'فشل تحميل النسخة الاحتياطية');
        } finally {
            setDownloadingFile(null);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`هل أنت متأكد من حذف النسخة الاحتياطية؟\n${filename}`)) return;
        setDeletingFile(filename);
        try {
            await apiClient.delete(`/database/backup/${encodeURIComponent(filename)}`);
            showToast('success', 'تم حذف النسخة الاحتياطية');
            setBackups(prev => prev.filter(b => b.filename !== filename));
        } catch {
            showToast('error', 'فشل حذف النسخة الاحتياطية');
        } finally {
            setDeletingFile(null);
        }
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold',
                    background: toast.type === 'success' ? '#166534' : '#991b1b',
                    color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Database size={28} color="#3b82f6" />
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>النسخ الاحتياطي</h1>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>{backups.length} نسخة محفوظة</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={fetchBackups} disabled={loadingList}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', color: '#475569', fontSize: '14px' }}>
                        <RefreshCw size={16} style={loadingList ? { animation: 'spin 1s linear infinite' } : {}} />
                        تحديث
                    </button>
                    <button onClick={handleCreate} disabled={creating}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: creating ? '#93c5fd' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 'bold', fontSize: '14px' }}>
                        {creating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <HardDrive size={16} />}
                        {creating ? 'جارٍ الإنشاء...' : 'نسخة احتياطية الآن'}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 110px 120px', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>
                    <span>اسم الملف</span>
                    <span>التاريخ</span>
                    <span>الحجم</span>
                    <span style={{ textAlign: 'center' }}>الإجراءات</span>
                </div>

                {loadingList ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
                        جارٍ التحميل...
                    </div>
                ) : backups.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                        <Database size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                        لا توجد نسخ احتياطية بعد
                    </div>
                ) : (
                    backups.map((backup, i) => (
                        <div key={backup.filename} style={{
                            display: 'grid', gridTemplateColumns: '1fr 160px 110px 120px',
                            padding: '14px 20px', alignItems: 'center',
                            borderBottom: i < backups.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: i % 2 === 0 ? 'white' : '#fafbfc',
                        }}>
                            {/* Filename + type badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                                    background: backup.type === 'manual' ? '#eff6ff' : '#f0fdf4',
                                    color: backup.type === 'manual' ? '#1d4ed8' : '#166534',
                                    border: `1px solid ${backup.type === 'manual' ? '#bfdbfe' : '#bbf7d0'}`,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {backup.type === 'manual' ? <Shield size={10} /> : <Zap size={10} />}
                                    {backup.type === 'manual' ? 'يدوي' : 'تلقائي'}
                                </span>
                                <span style={{ fontSize: '13px', color: '#334155', wordBreak: 'break-all' }}>{backup.filename}</span>
                            </div>
                            {/* Date */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px' }}>
                                <Clock size={12} />
                                {formatDate(backup.date)}
                            </div>
                            {/* Size */}
                            <span style={{ color: '#64748b', fontSize: '13px' }}>{formatSize(backup.size)}</span>
                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => handleDownload(backup.filename)}
                                    disabled={downloadingFile === backup.filename}
                                    title="تحميل"
                                    style={{ padding: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', color: '#1d4ed8', display: 'flex', alignItems: 'center' }}>
                                    {downloadingFile === backup.filename
                                        ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                                        : <Download size={15} />}
                                </button>
                                <button
                                    onClick={() => handleDelete(backup.filename)}
                                    disabled={deletingFile === backup.filename}
                                    title="حذف"
                                    style={{ padding: '6px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}>
                                    {deletingFile === backup.filename
                                        ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                                        : <Trash2 size={15} />}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

