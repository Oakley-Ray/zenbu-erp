import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PurchaseReturnItem } from './purchase-return-item.entity';

/** 採購退貨單 */
@Entity('purchase_returns')
@Index(['tenantId', 'purchaseOrderId'])
export class PurchaseReturn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 退貨單號 PR-YYYYMMDD-NNN */
  @Column({ unique: true })
  returnNumber!: string;

  /** 關聯採購單 */
  @Column('uuid')
  purchaseOrderId!: string;

  /** 關聯收貨單 */
  @Column('uuid')
  goodsReceiptId!: string;

  /** 供應商 ID */
  @Column('uuid')
  supplierId!: string;

  @OneToMany(() => PurchaseReturnItem, (item) => item.purchaseReturn, {
    cascade: true,
    eager: true,
  })
  items!: PurchaseReturnItem[];

  /** 退貨總金額 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ default: 'TWD' })
  currency!: string;

  @Column({ type: 'varchar', default: 'draft' })
  status!: string; // draft, submitted, confirmed, completed

  /** 建立人 */
  @Column('uuid', { nullable: true })
  createdBy?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
