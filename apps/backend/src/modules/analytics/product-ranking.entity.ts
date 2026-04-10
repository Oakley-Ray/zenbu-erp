import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

/** 產品排行快照 — 依時間區間統計 */
@Entity('product_rankings')
@Index(['tenantId', 'period', 'periodValue'])
export class ProductRanking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  /** 統計區間類型：daily / weekly / monthly */
  @Column()
  period!: string;

  /** 區間值：2026-04-05 / 2026-W14 / 2026-04 */
  @Column()
  periodValue!: string;

  @Column('uuid')
  productId!: string;

  @Column()
  productName!: string;

  @Column({ nullable: true })
  sku?: string;

  /** 銷售數量 */
  @Column({ type: 'int', default: 0 })
  quantitySold!: number;

  /** 銷售金額 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalRevenue!: number;

  /** 排名 */
  @Column({ type: 'int', default: 0 })
  rank!: number;
}
