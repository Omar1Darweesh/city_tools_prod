import apiClient from '../api/client';

function parseFilename(contentDisposition: string | undefined, fallback: string): string {
    if (!contentDisposition) return fallback;
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
    const match = contentDisposition.match(/filename="?([^";]+)"?/i);
    return match?.[1] ?? fallback;
}

export function downloadBlob(data: Blob, filename: string) {
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        a.remove();
        window.URL.revokeObjectURL(url);
    }, 200);
}

/** Create a fresh backup and trigger browser download (works on desktop & mobile). */
export async function createAndDownloadBackup(): Promise<string> {
    const fallback = `backup_manual_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.sql`;
    const response = await apiClient.post('/database/backup?download=1', null, {
        responseType: 'blob',
    });

    if (response.status >= 400) {
        throw new Error('Backup failed');
    }

    const contentType = response.headers['content-type'] ?? '';
    if (contentType.includes('application/json')) {
        const text = await (response.data as Blob).text();
        const err = JSON.parse(text);
        throw new Error(err.message || 'Backup failed');
    }

    const filename = parseFilename(response.headers['content-disposition'], fallback);
    downloadBlob(new Blob([response.data], { type: 'application/sql' }), filename);
    return filename;
}

/** Download an existing backup file from the server. */
export async function downloadBackupFile(filename: string): Promise<void> {
    const response = await apiClient.get('/database/backup/download', {
        params: { filename },
        responseType: 'blob',
    });
    downloadBlob(new Blob([response.data], { type: 'application/sql' }), filename);
}
