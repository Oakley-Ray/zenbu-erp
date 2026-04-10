import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GoodsReceiptStatus } from '@layerframe/shared-types';
import { GoodsReceiptItem } from './goods-receipt-item.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';

/** 收貨單 */
@Entity('goods_receipts')
@Index(['tenantId', 'purchaseOrderId'])
export class GoodsReceipt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 收貨單號 GR-YYYYMMDD-NNN */
  @Column({ unique: true })
  grNumber!: string;

  @Column('uuid')
  purchaseOrderId!: string;

  @ManyToOne(() => PurchaseOrder)
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder?: PurchaseOrder;

  @OneToMany(() => GoodsReceiptItem, (item) => item.goodsReceipt, {
    cascade: true,
    eager: true,
  })
  items!: GoodsReceiptItem[];

  @Column({ type: 'varchar', default: GoodsReceiptStatus.DRAFT })
  status!: GoodsReceiptStatus;

  /** 收貨人 */
  @Column('uuid', { nullable: true })
  receivedBy?: string;

  /** 收貨日期 */
  @Column({ type: 'date', nullable: true })
  receivedDate?: Date;

  /** 溢收容許比例（%，如 5 表示 ±5%） */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  overReceiveTolerance!: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
