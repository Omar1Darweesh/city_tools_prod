import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execPromise = promisify(exec);

export interface BackupInfo {
    filename: string;
    type: 'manual' | 'automatic';
    date: string;
    size: number;
    path: string;
}

@Injectable()
export class DatabaseService {

    private getBackupsDir(): string {
        return path.join(process.cwd(), '..', 'backups');
    }

    private resolvePgDump(): string {
        if (process.platform === 'win32') {
            const portablePath = path.join(process.cwd(), '..', 'postgresql-portable', 'bin', 'pg_dump.exe');
            if (fs.existsSync(portablePath)) return `"${portablePath}"`;
            return 'pg_dump';
        }
        // Linux: try common installation paths
        const linuxPaths = [
            '/usr/bin/pg_dump',
            '/usr/local/bin/pg_dump',
            '/usr/lib/postgresql/17/bin/pg_dump',
            '/usr/lib/postgresql/16/bin/pg_dump',
            '/usr/lib/postgresql/15/bin/pg_dump',
            '/usr/lib/postgresql/14/bin/pg_dump',
            '/usr/lib/postgresql/13/bin/pg_dump',
        ];
        for (const p of linuxPaths) {
            if (fs.existsSync(p)) return p;
        }
        return 'pg_dump';
    }

    private resolveConnectionUri(): string {
        if (process.env.DATABASE_URL) {
            // Strip Prisma-specific query params (?schema=public, etc.)
            return process.env.DATABASE_URL.split('?')[0];
        }
        const { PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE } = process.env;
        return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT || '5432'}/${PGDATABASE}`;
    }

    async createBackup(isManual: boolean = false): Promise<BackupInfo> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const type = isManual ? 'manual' : 'automatic';
        const filename = `backup_${type}_${timestamp}.sql`;

        const backupsDir = this.getBackupsDir();
        const backupPath = path.join(backupsDir, filename);

        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        const pgDump = this.resolvePgDump();
        const dbUri = this.resolveConnectionUri();

        console.log(`[Backup] type=${type} file=${filename} pgDump=${pgDump}`);

        const command = `${pgDump} "${dbUri}" -f "${backupPath}"`;

        try {
            const { stderr } = await execPromise(command, { env: { ...process.env } });
            if (stderr) console.warn('[Backup] pg_dump stderr:', stderr);

            if (!fs.existsSync(backupPath)) {
                throw new Error('Backup file was not created');
            }

            const stats = fs.statSync(backupPath);
            console.log(`[Backup] Success: ${stats.size} bytes`);

            return {
                filename,
                type,
                date: new Date().toISOString(),
                size: stats.size,
                path: backupPath,
            };
        } catch (error) {
            console.error('[Backup] Failed:', error.message);
            throw new Error(`Backup failed: ${error.message}`);
        }
    }

    listBackups(): BackupInfo[] {
        const backupsDir = this.getBackupsDir();
        if (!fs.existsSync(backupsDir)) return [];

        return fs.readdirSync(backupsDir)
            .filter(f => f.endsWith('.sql'))
            .map(filename => {
                const filePath = path.join(backupsDir, filename);
                const stats = fs.statSync(filePath);
                const isManual = filename.includes('_manual_');
                // Parse ISO date from filename: backup_manual_2026-05-16T14-30-00.sql
                const m = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})/);
                const date = m
                    ? `${m[1]}:${m[2]}:${m[3]}`
                    : stats.mtime.toISOString();
                return {
                    filename,
                    type: (isManual ? 'manual' : 'automatic') as 'manual' | 'automatic',
                    date,
                    size: stats.size,
                    path: filePath,
                };
            })
            .sort((a, b) => b.date.localeCompare(a.date));
    }

    deleteBackup(filename: string): void {
        if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
            throw new Error('Invalid filename');
        }
        const filePath = path.join(this.getBackupsDir(), filename);
        if (!fs.existsSync(filePath)) throw new Error(`Backup not found: ${filename}`);
        fs.unlinkSync(filePath);
    }
}