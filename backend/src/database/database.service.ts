import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execFilePromise = promisify(execFile);

export interface BackupInfo {
    filename: string;
    type: 'manual' | 'automatic';
    date: string;
    size: number;
    path: string;
}

interface DbConfig {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
}

@Injectable()
export class DatabaseService {

    private getBackupsDir(): string {
        return path.join(process.cwd(), '..', 'backups');
    }

    private resolvePgDump(): string {
        if (process.platform === 'win32') {
            const portablePath = path.join(process.cwd(), '..', 'postgresql-portable', 'bin', 'pg_dump.exe');
            if (fs.existsSync(portablePath)) return portablePath;
            return 'pg_dump';
        }
        const linuxPaths = [
            '/usr/lib/postgresql/17/bin/pg_dump',
            '/usr/lib/postgresql/16/bin/pg_dump',
            '/usr/lib/postgresql/15/bin/pg_dump',
            '/usr/lib/postgresql/14/bin/pg_dump',
            '/usr/lib/postgresql/13/bin/pg_dump',
            '/usr/bin/pg_dump',
            '/usr/local/bin/pg_dump',
        ];
        for (const p of linuxPaths) {
            if (fs.existsSync(p)) return p;
        }
        return 'pg_dump';
    }

    private getDbConfig(): DbConfig {
        if (process.env.DATABASE_URL) {
            const raw = process.env.DATABASE_URL.split('?')[0];
            const url = new URL(raw);
            return {
                host: url.hostname || 'localhost',
                port: url.port || '5432',
                user: decodeURIComponent(url.username),
                password: decodeURIComponent(url.password),
                database: url.pathname.replace(/^\//, ''),
            };
        }
        return {
            host: process.env.PGHOST || 'localhost',
            port: process.env.PGPORT || '5432',
            user: process.env.PGUSER || '',
            password: process.env.PGPASSWORD || '',
            database: process.env.PGDATABASE || '',
        };
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
        const db = this.getDbConfig();

        if (!db.user || !db.database) {
            throw new Error('Database credentials are not configured (DATABASE_URL or PG* env vars)');
        }

        console.log(`[Backup] type=${type} file=${filename} pgDump=${pgDump} db=${db.database}@${db.host}`);

        const args = [
            '-h', db.host,
            '-p', db.port,
            '-U', db.user,
            '-d', db.database,
            '-f', backupPath,
            '--no-owner',
            '--no-acl',
        ];

        try {
            await execFilePromise(pgDump, args, {
                env: { ...process.env, PGPASSWORD: db.password },
                maxBuffer: 50 * 1024 * 1024,
            });

            if (!fs.existsSync(backupPath)) {
                throw new Error('Backup file was not created');
            }

            const stats = fs.statSync(backupPath);
            if (stats.size === 0) {
                fs.unlinkSync(backupPath);
                throw new Error('Backup file is empty — check pg_dump and database connection');
            }

            console.log(`[Backup] Success: ${stats.size} bytes`);

            return {
                filename,
                type,
                date: new Date().toISOString(),
                size: stats.size,
                path: backupPath,
            };
        } catch (error: any) {
            if (fs.existsSync(backupPath)) {
                try { fs.unlinkSync(backupPath); } catch { /* ignore */ }
            }
            const detail = error?.stderr?.toString?.() || error?.message || String(error);
            console.error('[Backup] Failed:', detail);
            throw new Error(`Backup failed: ${detail.trim()}`);
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
