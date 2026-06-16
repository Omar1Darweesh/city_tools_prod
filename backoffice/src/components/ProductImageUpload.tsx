import { useRef, useState } from 'react';
import { ImageUp, Link, Loader2, X } from 'lucide-react';

interface Props {
    value: string;
    onChange: (value: string) => void;
}

function getUploadUrl(): string {
    const fromEnv = import.meta.env.VITE_UPLOAD_URL as string | undefined;
    if (fromEnv) return fromEnv;
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/upload`;
    }
    return '/upload';
}

function resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (typeof window !== 'undefined') {
        return url.startsWith('/') ? `${window.location.origin}${url}` : `${window.location.origin}/${url}`;
    }
    return url;
}

function parseImages(value: string): string[] {
    if (!value) return [];
    if (value.includes('||')) {
        return value.split('||').map((s) => s.trim()).filter(Boolean);
    }
    return [value.trim()].filter(Boolean);
}

export default function ProductImageUpload({ value, onChange }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [urlInput, setUrlInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const images = parseImages(value);

    const addImage = (url: string) => {
        if (url.startsWith('data:')) {
            setError('يرجى رفع الصورة مرة أخرى — لا يتم حفظ الصور المضمنة');
            return;
        }
        const next = images.length > 0 ? [...images, url] : [url];
        onChange(next.join('||'));
        setError('');
    };

    const removeImage = (index: number) => {
        const next = images.filter((_, i) => i !== index);
        onChange(next.join('||'));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('الملف يجب أن يكون صورة');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('حجم الصورة يجب أن يكون 5 ميجابايت أو أقل');
            return;
        }

        setUploading(true);
        setError('');
        try {
            const body = new FormData();
            body.append('file', file);
            body.append('folder', 'products');
            const res = await fetch(getUploadUrl(), { method: 'POST', body });
            const text = await res.text();
            let json: { url?: string; error?: string };
            try {
                json = JSON.parse(text);
            } catch {
                throw new Error('فشل رفع الصورة — استجابة غير صالحة من الخادم');
            }
            if (!res.ok || !json.url) {
                throw new Error(json.error || 'فشل رفع الصورة');
            }
            addImage(json.url);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'فشل رفع الصورة');
        } finally {
            setUploading(false);
        }
    };

    const handleUrlAdd = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;
        if (trimmed.startsWith('data:')) {
            setError('لا يمكن استخدام صورة مضمنة — استخدم رابطاً أو ارفع ملفاً');
            return;
        }
        addImage(trimmed);
        setUrlInput('');
    };

    const inputStyle: React.CSSProperties = {
        flex: 1,
        minWidth: 0,
        padding: '0.65rem 0.75rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {images.map((url, i) => (
                        <div
                            key={`${url}-${i}`}
                            style={{
                                position: 'relative',
                                width: 80,
                                height: 80,
                                borderRadius: '0.5rem',
                                overflow: 'hidden',
                                border: '1px solid #d1d5db',
                                flexShrink: 0,
                            }}
                        >
                            <img
                                src={resolveImageUrl(url)}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(i)}
                                style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: 'rgba(0,0,0,0.6)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.65rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1.5px dashed #d1d5db',
                        background: '#f9fafb',
                        color: '#374151',
                        cursor: uploading ? 'wait' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        opacity: uploading ? 0.7 : 1,
                    }}
                >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageUp size={14} />}
                    {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                />
                <div style={{ display: 'flex', flex: 1, gap: '0.375rem', minWidth: 200 }}>
                    <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
                        placeholder="أو أدخل رابط الصورة"
                        style={inputStyle}
                        disabled={uploading}
                    />
                    <button
                        type="button"
                        onClick={handleUrlAdd}
                        disabled={!urlInput.trim() || uploading}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.375rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #d1d5db',
                            background: '#fff',
                            color: urlInput.trim() ? '#111827' : '#9ca3af',
                            cursor: urlInput.trim() && !uploading ? 'pointer' : 'default',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            opacity: urlInput.trim() && !uploading ? 1 : 0.5,
                        }}
                    >
                        <Link size={14} />
                        إضافة
                    </button>
                </div>
            </div>

            {error && <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: 0 }}>{error}</p>}

            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                ارفع صورة (حتى 5 ميجابايت) أو أدخل رابطاً. الصورة الأولى تظهر في الموقع وقائمة المنتجات.
            </p>
        </div>
    );
}
