import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReturnReason } from '@layerframe/shared-types';
import { PurchaseReturn } from './purchase-return.entity';

/** 採購退貨單明細 */
@Entity('purchase_return_items')
export class PurchaseReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  purchaseReturnId!: string;

  @ManyToOne(() => PurchaseReturn, (pr) => pr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseReturnId' })
  purchaseReturn?: PurchaseReturn;

  @Column('uuid', { nullable: true })
  productId?: string;

  @Column()
  productName!: string;

  @Column({ nullable: true })
  sku?: string;

  /** 退貨數量 */
  @Column({ type: 'int' })
  returnQty!: number;

  /** 單價 */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: number;

  /** 小計 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal!: number;

  /** 退貨原因 */
  @Column({ type: 'varchar' })
  reason!: ReturnReason;

  /** 照片佐證 */
  @Column({ type: 'jsonb', nullable: true })
  photos?: string[];

  @Column({ type: 'text', nullable: true })
  note?: string;
}
