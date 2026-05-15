import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execPromise = promisify(exec);

@Injectable()
export class DatabaseService {

    private resolvePgDump(): string {
        if (process.platform === 'win32') {
            const portablePath = path.join(process.cwd(), '..', 'postgresql-portable', 'bin', 'pg_dump.exe');
            if (fs.existsSync(portablePath)) return `"${portablePath}"`;
        }
        // Linux/Mac: pg_dump is on PATH
        return 'pg_dump';
    }

    private resolveConnectionUri(): string {
        if (process.env.DATABASE_URL) {
            return process.env.DATABASE_URL;
        }
        const { PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE } = process.env;
        return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT || '5432'}/${PGDATABASE}`;
    }

    async createBackup(isManual: boolean = false): Promise<{
        success: boolean;
        filename: string;
        type: string;
        size: number;
        path: string;
        timestamp: string;
    }> {
        console.log('=== BACKUP PROCESS STARTED ===');
        console.log('Backup Type:', isManual ? 'Manual' : 'Automatic');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = isManual
            ? `backup_manual_${timestamp}.sql`
            : `backup_automatic_${timestamp}.sql`;

        const backupsDir = path.join(process.cwd(), '..', 'backups');
        const backupPath = path.join(backupsDir, filename);

        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        const pgDump = this.resolvePgDump();
        const dbUri = this.resolveConnectionUri();

        const command = `${pgDump} "${dbUri}" -f "${backupPath}"`;
        console.log('Running pg_dump...');

        try {
            const result = await execPromise(command, {
                env: { ...process.env },
            });

            if (result.stderr) console.warn('pg_dump stderr:', result.stderr);

            if (!fs.existsSync(backupPath)) {
                throw new Error('Backup file was not created');
            }

            const stats = fs.statSync(backupPath);
            console.log(`=== BACKUP SUCCESS === size: ${stats.size} bytes`);

            return {
                success: true,
                filename,
                type: isManual ? 'Manual' : 'Automatic',
                size: stats.size,
                path: backupPath,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('=== BACKUP FAILED ===', error.message);
            throw new Error(`Backup failed: ${error.message}`);
        }
    }
}