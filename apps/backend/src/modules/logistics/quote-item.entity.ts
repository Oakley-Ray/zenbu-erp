import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Quote } from './quote.entity';

/** 報價單明細 — 每件貨物的尺寸、重量、材積重 */
@Entity('logistics_quote_items')
export class QuoteItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  quoteId!: string;

  @ManyToOne(() => Quote, (q) => q.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quoteId' })
  quote?: Quote;

  /** 貨物描述 */
  @Column()
  description!: string;

  /** 關聯產品（如有） */
  @Column('uuid', { nullable: true })
  productId?: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  /** 尺寸（公分） */
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  lengthCm!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  widthCm!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  heightCm!: number;

  /** 實際重量（公斤） */
  @Column({ type: 'decimal', precision: 8, scale: 3 })
  actualWeightKg!: number;

  /** 材積重（公斤）— 由系統計算 */
  @Column({ type: 'decimal', precision: 8, scale: 3, default: 0 })
  volumetricWeightKg!: number;

  /** 計費重 = max(實重, 材積重) */
  @Column({ type: 'decimal', precision: 8, scale: 3, default: 0 })
  chargeableWeightKg!: number;
}
