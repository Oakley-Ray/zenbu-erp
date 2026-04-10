import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload } from '@layerframe/shared-types';

@Controller('analytics')
@Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.FINANCE)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ── 即時 KPI ──

  /** 儀表板 KPI — 今日營收、訂單數、待處理、庫存警告等 */
  @Get('dashboard')
  getDashboard(@Request() req: { user: JwtPayload }) {
    return this.analyticsService.getDashboardKpi(req.user.tenantId);
  }

  // ── 營收趨勢 ──

  /** 每日營收趨勢 */
  @Get('trends/revenue')
  getRevenueTrend(
    @Request() req: { user: JwtPayload },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getRevenueTrend(req.user.tenantId, startDate, endDate);
  }

  /** 月度營收摘要 */
  @Get('trends/monthly')
  getMonthlyRevenue(
    @Request() req: { user: JwtPayload },
    @Query('year') year: string,
  ) {
    return this.analyticsService.getMonthlyRevenue(
      req.user.tenantId,
      year ? Number(year) : new Date().getFullYear(),
    );
  }

  // ── 排行榜 ──

  /** 熱銷商品排行 */
  @Get('rankings/products')
  getTopProducts(
    @Request() req: { user: JwtPayload },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopProducts(
      req.user.tenantId,
      startDate,
      endDate,
      limit ? Number(limit) : 10,
    );
  }

  /** VIP 顧客排行 */
  @Get('rankings/customers')
  getTopCustomers(
    @Request() req: { user: JwtPayload },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopCustomers(
      req.user.tenantId,
      startDate,
      endDate,
      limit ? Number(limit) : 10,
    );
  }

  /** 分類銷售佔比 */
  @Get('rankings/categories')
  getCategoryBreakdown(
    @Request() req: { user: JwtPayload },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getCategoryBreakdown(
      req.user.tenantId,
      startDate,
      endDate,
    );
  }

  // ── 快照管理 ──

  /** 手動刷新快照（過去 N 天） */
  @Post('snapshots/refresh')
  @Roles(TenantRole.SUPER_ADMIN)
  refreshSnapshots(
    @Request() req: { user: JwtPayload },
    @Query('days') days?: string,
  ) {
    return this.analyticsService
      .refreshRecentSnapshots(req.user.tenantId, days ? Number(days) : 30)
      .then((count) => ({ message: `已刷新 ${count} 天的快照` }));
  }

  // ── CSV 匯出 ──

  /** 匯出營收趨勢 CSV */
  @Get('export/revenue')
  async exportRevenue(
    @Request() req: { user: JwtPayload },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const csv = await this.analyticsService.exportRevenueTrendCsv(
      req.user.tenantId,
      startDate,
      endDate,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=revenue_${startDate}_${endDate}.csv`);
    // BOM for Excel 中文支援
    res.send('\ufeff' + csv);
  }

  /** 匯出熱銷商品 CSV */
  @Get('export/products')
  async exportProducts(
    @Request() req: { user: JwtPayload },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit: string | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.analyticsService.exportTopProductsCsv(
      req.user.tenantId,
      startDate,
      endDate,
      limit ? Number(limit) : 50,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=top_products_${startDate}_${endDate}.csv`);
    res.send('\ufeff' + csv);
  }
}
