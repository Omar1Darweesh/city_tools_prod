import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaService } from '../prisma.service';
import { BranchScopeService } from '../auth/branch-scope.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService, BranchScopeService],
  exports: [ReportsService],
})
export class ReportsModule {}
