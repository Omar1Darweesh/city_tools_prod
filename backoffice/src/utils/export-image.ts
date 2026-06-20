type ImgExt = 'jpeg' | 'png' | 'gif';

export function getFirstProductImageUrl(images: string[] | string | undefined | null): string {
    if (!images) return '';
    if (Array.isArray(images)) return (images[0] || '').trim();
    const s = String(images).trim();
    if (!s) return '';
    if (s.startsWith('[')) {
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return String(parsed[0] || '').trim();
        } catch {
            /* use raw string */
        }
    }
    if (s.includes('||')) return s.split('||')[0].trim();
    return s;
}

export function resolveExportImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

function decodeDataUrl(url: string): { buffer: ArrayBuffer; ext: ImgExt } | null {
    const m = url.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/i);
    if (!m) return null;
    const ext: ImgExt = m[1] === 'jpg' ? 'jpeg' : m[1] === 'webp' ? 'png' : (m[1].toLowerCase() as ImgExt);
    const bin = atob(m[2]);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return { buffer: buf.buffer, ext };
}

function extFromUrl(url: string): ImgExt {
    const rawExt = url.match(/\.(png|jpe?g|gif|webp)(\?|$)/i)?.[1]?.toLowerCase().replace('jpg', 'jpeg') || 'jpeg';
    return rawExt === 'webp' ? 'png' : (rawExt as ImgExt);
}

/** Load product image bytes for Excel export (handles /uploads paths, http, and data URLs). */
export async function loadExportImage(rawUrl: string): Promise<{ buffer: ArrayBuffer; ext: ImgExt } | null> {
    if (!rawUrl) return null;

    const url = resolveExportImageUrl(rawUrl);
    const embedded = decodeDataUrl(url);
    if (embedded) return embedded;

    try {
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok) return null;
        const buffer = await response.arrayBuffer();
        if (!buffer.byteLength) return null;
        return { buffer, ext: extFromUrl(url) };
    } catch {
        return null;
    }
}
