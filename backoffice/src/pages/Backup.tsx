import { useState } from 'react';
import apiClient from '../api/client';
import { Database, Download, CheckCircle, AlertCircle, Loader2, HardDrive, Clock } from 'lucide-react';

export default function Backup() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [lastBackup, setLastBackup] = useState<string | null>(null);

    const handleDownload = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const response = await apiClient.get('/database/backup/download', {
                responseType: 'blob',
            });

            const contentDisposition = response.headers['content-disposition'] || '';
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            const filename = filenameMatch
                ? filenameMatch[1]
                : `backup_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.sql`;

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            const now = new Date().toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
            setLastBackup(now);
            setStatus({ type: 'success', message: 'تم تحميل النسخة الاحتياطية بنجاح' });
        } catch {
            setStatus({ type: 'error', message: 'فشل إنشاء النسخة الاحتياطية. تأكد من إعدادات قاعدة البيانات.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Database size={28} color="#3b82f6" />
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                        النسخ الاحتياطي
                    </h1>
                </div>
                <p style={{ color: '#64748b', margin: 0 }}>احتفظ بنسخة احتياطية من قاعدة البيانات على جهازك</p>
            </div>

            {/* Card */}
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                maxWidth: '520px',
                border: '1px solid #e2e8f0',
            }}>
                {/* Icon + Title */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex',
                        background: '#eff6ff',
                        borderRadius: '50%',
                        padding: '20px',
                        marginBottom: '16px',
                    }}>
                        <HardDrive size={40} color="#3b82f6" />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px' }}>
                        نسخة احتياطية يدوية
                    </h2>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                        انقر على الزر أدناه لإنشاء نسخة احتياطية كاملة من قاعدة البيانات وتحميلها مباشرةً على جهازك.
                    </p>
                </div>

                {/* Last backup info */}
                {lastBackup && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '24px',
                        fontSize: '13px',
                        color: '#475569',
                    }}>
                        <Clock size={14} />
                        <span>آخر نسخة: {lastBackup}</span>
                    </div>
                )}

                {/* Status message */}
                {status && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '24px',
                        background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: status.type === 'success' ? '#166534' : '#991b1b',
                        border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                        fontSize: '14px',
                    }}>
                        {status.type === 'success'
                            ? <CheckCircle size={18} />
                            : <AlertCircle size={18} />}
                        <span>{status.message}</span>
                    </div>
                )}

                {/* Download button */}
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '14px 24px',
                        background: loading ? '#93c5fd' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        fontFamily: 'Cairo, sans-serif',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                    }}
                >
                    {loading
                        ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ إنشاء النسخة...</>
                        : <><Download size={20} /> تحميل نسخة احتياطية</>
                    }
                </button>

                {/* Note */}
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '16px', marginBottom: 0 }}>
                    صيغة الملف: SQL · متوافق مع PostgreSQL
                </p>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
