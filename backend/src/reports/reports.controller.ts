import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchScopeService } from '../auth/branch-scope.service';
import { parseQueryDateRange } from '../common/egypt-time.util';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly branchScope: BranchScopeService,
  ) {}

  private dateParams(startDate?: string, endDate?: string) {
    return parseQueryDateRange(startDate, endDate);
  }

  private async scopedParams(
    req: Request,
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ) {
    return {
      ...this.dateParams(startDate, endDate),
      branchId: await this.branchScope.resolveBranchId(
        (req as any).user.userId,
        branchId ? parseInt(branchId, 10) : undefined,
      ),
    };
  }

  @Get('sales-summary')
  getSalesSummary(
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getSalesSummary(p),
    );
  }

  @Get('top-products')
  getTopProducts(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getTopProducts({
        limit: limit ? parseInt(limit, 10) : undefined,
        ...p,
      }),
    );
  }

  @Get('low-stock')
  getLowStockProducts(
    @Req() req: Request,
    @Query('threshold') threshold?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.branchScope
      .resolveBranchId(
        (req as any).user.userId,
        branchId ? parseInt(branchId, 10) : undefined,
      )
      .then((resolvedBranchId) =>
        this.reportsService.getLowStockProducts({
          threshold: threshold ? parseInt(threshold, 10) : undefined,
          branchId: resolvedBranchId,
        }),
      );
  }

  @Get('dashboard')
  getDashboardMetrics(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getDashboardMetrics(p),
    );
  }

  @Get('dashboard-summary')
  getDashboardSummary(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getDashboardSummary(p),
    );
  }

  @Get('export/json')
  async exportJSON(
    @Req() req: Request,
    @Query('reportType') reportType: string = 'dashboard',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    const params = await this.scopedParams(req, startDate, endDate, branchId);

    switch (reportType) {
      case 'sales':
        return this.reportsService.getSalesSummary(params);
      case 'top-products':
        return this.reportsService.getTopProducts({ limit: 20, ...params });
      case 'low-stock':
        return this.reportsService.getLowStockProducts({
          threshold: 10,
          branchId: params.branchId,
        });
      case 'dashboard':
      default:
        return this.reportsService.getDashboardMetrics(params);
    }
  }

  @Get('enhanced')
  getEnhancedDashboardMetrics(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getEnhancedDashboardMetrics(p),
    );
  }

  @Get('customers')
  getCustomerAnalytics(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getCustomerAnalytics(p),
    );
  }

  @Get('returns-analysis')
  getReturnsAnalysis(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getReturnsAnalysis(p),
    );
  }

  @Get('daily-trend')
  getDailySalesTrend(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getDailySalesTrend(p),
    );
  }

  @Get('profit-by-category')
  getProfitByCategory(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getProfitByCategory(p),
    );
  }

  @Get('comparison')
  getPeriodComparison(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getPeriodComparison(p),
    );
  }

  @Get('platform-sales')
  getPlatformSalesDetails(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeComparison') includeComparison?: string,
  ) {
    return this.scopedParams(req, startDate, endDate, branchId).then((p) =>
      this.reportsService.getPlatformSalesDetails({
        ...p,
        includePeriodComparison: includeComparison !== 'false',
      }),
    );
  }
}
