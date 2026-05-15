import { Controller, Post, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
    constructor(private readonly databaseService: DatabaseService) { }

    @Post('backup')
    async createBackup() {
        return this.databaseService.createBackup(true);
    }

    @Get('backup/download')
    async downloadBackup(@Res() res: Response) {
        const result = await this.databaseService.createBackup(true);
        res.download(result.path, result.filename);
    }
}
