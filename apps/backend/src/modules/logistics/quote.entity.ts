import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { QuoteStatus } from '@layerframe/shared-types';
import { QuoteItem } from './quote-item.entity';

/** 物流報價單 */
@Entity('logistics_quotes')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'createdAt'])
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 報價單編號（如 LQ-20260405-001） */
  @Column({ unique: true })
  quoteNumber!: string;

  /** 關聯訂單（如有） */
  @Column('uuid', { nullable: true })
  orderId?: string;

  /** 客戶 */
  @Column('uuid', { nullable: true })
  customerId?: string;

  @Column({ nullable: true })
  customerName?: string;

  @OneToMany(() => QuoteItem, (item) => item.quote, { cascade: true, eager: true })
  items!: QuoteItem[];

  /** 寄件地 */
  @Column({ type: 'jsonb' })
  origin!: {
    country: string;
    city?: string;
    postalCode?: string;
  };

  /** 目的地 */
  @Column({ type: 'jsonb' })
  destination!: {
    country: string;
    city?: string;
    postalCode?: string;
    address?: string;
  };

  /** 選定的物流商 ID（客戶確認後填入） */
  @Column('uuid', { nullable: true })
  selectedCarrierId?: string;

  /** 總重量（計費重，取材積重和實重的較大值） */
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  totalChargeableWeightKg!: number;

  /** 總運費（選定方案的費用） */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalShippingFee!: number;

  @Column({ default: 'TWD' })
  currency!: string;

  @Column({ type: 'varchar', default: QuoteStatus.DRAFT })
  status!: QuoteStatus;

  /** 報價有效期限 */
  @Column({ type: 'timestamp', nullable: true })
  validUntil?: Date;

  @Column({ type: 'text', nullable: true })
  note?: string;

  /** 操作人 */
  @Column('uuid', { nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
