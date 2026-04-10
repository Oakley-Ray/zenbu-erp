import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { DailySalesSnapshot } from './daily-snapshot.entity';
import { ProductRanking } from './product-ranking.entity';
import { CustomerRanking } from './customer-ranking.entity';

/** 儀表板即時 KPI */
export interface DashboardKpi {
  todayRevenue: number;
  todayOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  lowStockItems: number;
  activeCustomers: number;
  monthRevenue: number;
  monthOrders: number;
}

/** 趨勢資料點 */
export interface TrendPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(DailySalesSnapshot)
    private readonly snapshotRepo: Repository<DailySalesSnapshot>,
    @InjectRepository(ProductRanking)
    private readonly productRankingRepo: Repository<ProductRanking>,
    @InjectRepository(CustomerRanking)
    private readonly customerRankingRepo: Repository<CustomerRanking>,
    private readonly dataSource: DataSource,
  ) {}

  // ══════════════════════════════════
  // 即時 KPI（直接查 orders / inventory）
  // ══════════════════════════════════

  async getDashboardKpi(tenantId: string): Promise<DashboardKpi> {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';

    // 平行查詢多個指標
    const [todayStats, monthStats, pendingOrders, lowStockItems, activeCustomers] =
      await Promise.all([
        this.getRevenueStats(tenantId, today, today),
        this.getRevenueStats(tenantId, monthStart, today),
        this.countOrders(tenantId, 'pending'),
        this.countLowStock(tenantId),
        this.countActiveCustomers(tenantId, monthStart),
      ]);

    return {
      todayRevenue: todayStats.revenue,
      todayOrders: todayStats.orderCount,
      averageOrderValue:
        todayStats.orderCount > 0
          ? todayStats.revenue / todayStats.orderCount
          : 0,
      pendingOrders,
      lowStockItems,
      activeCustomers,
      monthRevenue: monthStats.revenue,
      monthOrders: monthStats.orderCount,
    };
  }

  // ══════════════════════════════════
  // 營收趨勢
  // ══════════════════════════════════

  /** 取得指定日期區間的每日趨勢 */
  async getRevenueTrend(
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<TrendPoint[]> {
    // 優先從快照表讀取（速度快）
    const snapshots = await this.snapshotRepo.find({
      where: {
        tenantId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    if (snapshots.length > 0) {
      return snapshots.map((s) => ({
        date: s.date,
        revenue: Number(s.revenue),
        orderCount: s.orderCount,
      }));
    }

    // 如果沒有快照，即時計算（較慢但保證有資料）
    return this.calculateDailyTrend(tenantId, startDate, endDate);
  }

  /** 月度營收摘要 */
  async getMonthlyRevenue(tenantId: string, year: number): Promise<{
    month: string;
    revenue: number;
    orderCount: number;
  }[]> {
    const result = await this.dataSource.query(
      `SELECT
        TO_CHAR(o."createdAt", 'YYYY-MM') as month,
        COALESCE(SUM(o."totalAmount"), 0)::numeric as revenue,
        COUNT(o.id)::int as "orderCount"
      FROM orders o
      WHERE o."tenantId" = $1
        AND EXTRACT(YEAR FROM o."createdAt") = $2
        AND o.status NOT IN ('cancelled', 'draft')
      GROUP BY TO_CHAR(o."createdAt", 'YYYY-MM')
      ORDER BY month ASC`,
      [tenantId, year],
    );
    return result;
  }

  // ══════════════════════════════════
  // 排行榜
  // ══════════════════════════════════

  /** 熱銷商品排行（即時計算） */
  async getTopProducts(
    tenantId: string,
    startDate: string,
    endDate: string,
    limit = 10,
  ) {
    const result = await this.dataSource.query(
      `SELECT
        oi."productId",
        oi."productName",
        oi.sku,
        SUM(oi.quantity)::int as "quantitySold",
        SUM(oi.subtotal)::numeric as "totalRevenue"
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      WHERE o."tenantId" = $1
        AND o."createdAt" >= $2
        AND o."createdAt" <= ($3::date + interval '1 day')
        AND o.status NOT IN ('cancelled', 'draft')
      GROUP BY oi."productId", oi."productName", oi.sku
      ORDER BY "quantitySold" DESC
      LIMIT $4`,
      [tenantId, startDate, endDate, limit],
    );
    return result;
  }

  /** VIP 顧客排行（即時計算） */
  async getTopCustomers(
    tenantId: string,
    startDate: string,
    endDate: string,
    limit = 10,
  ) {
    const result = await this.dataSource.query(
      `SELECT
        o."customerId",
        o."customerName",
        o."customerEmail",
        SUM(o."totalAmount")::numeric as "totalSpent",
        COUNT(o.id)::int as "orderCount"
      FROM orders o
      WHERE o."tenantId" = $1
        AND o."createdAt" >= $2
        AND o."createdAt" <= ($3::date + interval '1 day')
        AND o.status NOT IN ('cancelled', 'draft')
      GROUP BY o."customerId", o."customerName", o."customerEmail"
      ORDER BY "totalSpent" DESC
      LIMIT $4`,
      [tenantId, startDate, endDate, limit],
    );
    return result;
  }

  /** 分類銷售佔比 */
  async getCategoryBreakdown(tenantId: string, startDate: string, endDate: string) {
    const result = await this.dataSource.query(
      `SELECT
        c.id as "categoryId",
        c.name as "categoryName",
        SUM(oi.subtotal)::numeric as "totalRevenue",
        SUM(oi.quantity)::int as "totalQuantity"
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      LEFT JOIN products p ON p.id = oi."productId"
      LEFT JOIN categories c ON c.id = p."categoryId"
      WHERE o."tenantId" = $1
        AND o."createdAt" >= $2
        AND o."createdAt" <= ($3::date + interval '1 day')
        AND o.status NOT IN ('cancelled', 'draft')
      GROUP BY c.id, c.name
      ORDER BY "totalRevenue" DESC`,
      [tenantId, startDate, endDate],
    );
    return result;
  }

  // ══════════════════════════════════
  // 快照排程（每小時 / 每日執行）
  // ══════════════════════════════════

  /** 重新產生指定日期的快照 */
  async refreshSnapshot(tenantId: string, date: string): Promise<DailySalesSnapshot> {
    const stats = await this.getRevenueStats(tenantId, date, date);

    const newCustomers = await this.dataSource.query(
      `SELECT COUNT(*)::int as count
       FROM customers
       WHERE "tenantId" = $1 AND DATE("createdAt") = $2`,
      [tenantId, date],
    );

    const cancelledOrders = await this.dataSource.query(
      `SELECT
        COUNT(*)::int as count,
        COALESCE(SUM("totalAmount"), 0)::numeric as refund
       FROM orders
       WHERE "tenantId" = $1
         AND DATE("createdAt") = $2
         AND status IN ('cancelled', 'returned')`,
      [tenantId, date],
    );

    const uniqueCustomers = await this.dataSource.query(
      `SELECT COUNT(DISTINCT "customerId")::int as count
       FROM orders
       WHERE "tenantId" = $1
         AND DATE("createdAt") = $2
         AND status NOT IN ('cancelled', 'draft')`,
      [tenantId, date],
    );

    // Upsert — 如果已存在就更新
    let snapshot = await this.snapshotRepo.findOne({ where: { tenantId, date } });
    if (!snapshot) {
      snapshot = this.snapshotRepo.create({ tenantId, date });
    }

    snapshot.revenue = stats.revenue;
    snapshot.orderCount = stats.orderCount;
    snapshot.averageOrderValue =
      stats.orderCount > 0 ? stats.revenue / stats.orderCount : 0;
    snapshot.newCustomers = newCustomers[0]?.count ?? 0;
    snapshot.cancelledOrders = cancelledOrders[0]?.count ?? 0;
    snapshot.refundAmount = Number(cancelledOrders[0]?.refund ?? 0);
    snapshot.uniqueCustomers = uniqueCustomers[0]?.count ?? 0;

    return this.snapshotRepo.save(snapshot);
  }

  /** 批次刷新：過去 N 天的快照 */
  async refreshRecentSnapshots(tenantId: string, days = 30): Promise<number> {
    let count = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      await this.refreshSnapshot(tenantId, date);
      count++;
    }
    return count;
  }

  // ══════════════════════════════════
  // CSV 匯出
  // ══════════════════════════════════

  /** 匯出營收趨勢為 CSV 字串 */
  async exportRevenueTrendCsv(
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<string> {
    const trend = await this.getRevenueTrend(tenantId, startDate, endDate);
    const header = '日期,營收,訂單數';
    const rows = trend.map((t) => `${t.date},${t.revenue},${t.orderCount}`);
    return [header, ...rows].join('\n');
  }

  /** 匯出熱銷商品為 CSV 字串 */
  async exportTopProductsCsv(
    tenantId: string,
    startDate: string,
    endDate: string,
    limit = 50,
  ): Promise<string> {
    const products = await this.getTopProducts(tenantId, startDate, endDate, limit);
    const header = '產品名稱,SKU,銷售數量,銷售金額';
    const rows = products.map(
      (p: any) => `"${p.productName}",${p.sku ?? ''},${p.quantitySold},${p.totalRevenue}`,
    );
    return [header, ...rows].join('\n');
  }

  // ══════════════════════════════════
  // 內部查詢方法
  // ══════════════════════════════════

  private async getRevenueStats(
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ revenue: number; orderCount: number }> {
    const result = await this.dataSource.query(
      `SELECT
        COALESCE(SUM("totalAmount"), 0)::numeric as revenue,
        COUNT(*)::int as "orderCount"
      FROM orders
      WHERE "tenantId" = $1
        AND "createdAt" >= $2
        AND "createdAt" <= ($3::date + interval '1 day')
        AND status NOT IN ('cancelled', 'draft')`,
      [tenantId, startDate, endDate],
    );
    return {
      revenue: Number(result[0]?.revenue ?? 0),
      orderCount: result[0]?.orderCount ?? 0,
    };
  }

  private async calculateDailyTrend(
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<TrendPoint[]> {
    const result = await this.dataSource.query(
      `SELECT
        DATE("createdAt")::text as date,
        COALESCE(SUM("totalAmount"), 0)::numeric as revenue,
        COUNT(*)::int as "orderCount"
      FROM orders
      WHERE "tenantId" = $1
        AND "createdAt" >= $2
        AND "createdAt" <= ($3::date + interval '1 day')
        AND status NOT IN ('cancelled', 'draft')
      GROUP BY DATE("createdAt")
      ORDER BY date ASC`,
      [tenantId, startDate, endDate],
    );
    return result.map((r: any) => ({
      date: r.date,
      revenue: Number(r.revenue),
      orderCount: r.orderCount,
    }));
  }

  private async countOrders(tenantId: string, status: string): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM orders WHERE "tenantId" = $1 AND status = $2`,
      [tenantId, status],
    );
    return result[0]?.count ?? 0;
  }

  private async countLowStock(tenantId: string): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM inventory
       WHERE "tenantId" = $1 AND quantity <= "safetyStock" AND "safetyStock" > 0`,
      [tenantId],
    );
    return result[0]?.count ?? 0;
  }

  private async countActiveCustomers(tenantId: string, since: string): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(DISTINCT "customerId")::int as count
       FROM orders
       WHERE "tenantId" = $1 AND "createdAt" >= $2 AND status NOT IN ('cancelled', 'draft')`,
      [tenantId, since],
    );
    return result[0]?.count ?? 0;
  }
}
