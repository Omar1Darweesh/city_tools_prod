import { Controller, Post, Get, Delete, Param, Query, Res, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
    constructor(private readonly databaseService: DatabaseService) { }

    /** GET /database/backup/export — create backup and download (browser-friendly, no POST body) */
    @Get('backup/export')
    async exportBackup(@Res() res: Response) {
        try {
            const result = await this.databaseService.createBackup(true);
            res.setHeader('Cache-Control', 'no-store');
            return res.download(result.path, result.filename);
        } catch (error: any) {
            throw new HttpException(error?.message || 'Backup failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** POST /database/backup — create manual backup; ?download=1 streams file to browser */
    @Post('backup')
    async createBackup(@Query('download') download: string | undefined, @Res() res: Response) {
        try {
            const result = await this.databaseService.createBackup(true);
            const { path, filename, type, date, size } = result;

            if (download === 'true' || download === '1') {
                return res.download(path, filename);
            }

            return res.status(HttpStatus.CREATED).json({ success: true, filename, type, date, size });
        } catch (error: any) {
            throw new HttpException(error?.message || 'Backup failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** GET /database/backups — list all backup files */
    @Get('backups')
    listBackups() {
        return this.databaseService.listBackups();
    }

    /** GET /database/backup/download?filename=xxx — download a backup file */
    @Get('backup/download')
    async downloadBackup(@Query('filename') filename: string, @Res() res: Response) {
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            throw new HttpException('Invalid filename', HttpStatus.BAD_REQUEST);
        }
        const backups = this.databaseService.listBackups();
        const backup = backups.find(b => b.filename === filename);
        if (!backup) throw new HttpException('Backup not found', HttpStatus.NOT_FOUND);
        res.download(backup.path, backup.filename);
    }

    /** DELETE /database/backup/:filename — delete a backup file */
    @Delete('backup/:filename')
    deleteBackup(@Param('filename') filename: string) {
        this.databaseService.deleteBackup(filename);
        return { success: true };
    }
}
