import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

/**
 * 每日銷售快照 — 由排程每小時刷新 Materialized View，
 * 再寫入此 table 做歷史保存。
 * 好處：查詢不用即時跑大量 JOIN/GROUP BY，速度快很多。
 */
@Entity('daily_sales_snapshots')
@Index(['tenantId', 'date'], { unique: true })
export class DailySalesSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column({ type: 'date' })
  date!: string;

  /** 當日營收 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  revenue!: number;

  /** 當日訂單數 */
  @Column({ type: 'int', default: 0 })
  orderCount!: number;

  /** 平均客單價 */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  averageOrderValue!: number;

  /** 新客數 */
  @Column({ type: 'int', default: 0 })
  newCustomers!: number;

  /** 退貨/取消數 */
  @Column({ type: 'int', default: 0 })
  cancelledOrders!: number;

  /** 退款金額 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  refundAmount!: number;

  /** 不重複下單客戶數 */
  @Column({ type: 'int', default: 0 })
  uniqueCustomers!: number;
}
