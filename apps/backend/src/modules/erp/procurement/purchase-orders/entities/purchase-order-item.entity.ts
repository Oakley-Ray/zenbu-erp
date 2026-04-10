import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';

/** 採購訂單明細 */
@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  purchaseOrderId!: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder?: PurchaseOrder;

  /** 產品ID（可 null 表示非系統內品項） */
  @Column('uuid', { nullable: true })
  productId?: string;

  /** 品項名稱（快照） */
  @Column()
  productName!: string;

  /** SKU（快照） */
  @Column({ nullable: true })
  sku?: string;

  /** 規格描述 */
  @Column({ nullable: true })
  specification?: string;

  /** 單價 */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: number;

  /** 訂購數量 */
  @Column({ type: 'int' })
  orderedQty!: number;

  /** 已到貨數量 */
  @Column({ type: 'int', default: 0 })
  receivedQty!: number;

  /** 小計 = unitPrice * orderedQty */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal!: number;

  /** 單位 */
  @Column({ default: 'pcs' })
  unit!: string;

  /** 未交數量 */
  get pendingQty(): number {
    return this.orderedQty - this.receivedQty;
  }
}
