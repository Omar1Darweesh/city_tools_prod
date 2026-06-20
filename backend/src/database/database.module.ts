import { Module } from '@nestjs/common';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';
import { PrismaService } from '../prisma.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  controllers: [DatabaseController],
  providers: [DatabaseService, PrismaService, AdminGuard],
})
export class DatabaseModule {}
