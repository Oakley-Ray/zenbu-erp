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
import { PurchaseOrderStatus, ApprovalLevel } from '@layerframe/shared-types';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';

/** 採購訂單 */
@Entity('purchase_orders')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'createdAt'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 採購單號 PO-YYYYMM-NNN */
  @Column({ unique: true })
  poNumber!: string;

  /** 版本號（每次 amendment +1） */
  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column('uuid')
  supplierId!: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, {
    cascade: true,
    eager: true,
  })
  items!: PurchaseOrderItem[];

  /** 小計 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal!: number;

  /** 稅額 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  tax!: number;

  /** 總金額 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ default: 'TWD' })
  currency!: string;

  @Column({ type: 'varchar', default: PurchaseOrderStatus.DRAFT })
  status!: PurchaseOrderStatus;

  /** 審核層級（依金額自動決定） */
  @Column({ type: 'varchar', nullable: true })
  approvalLevel?: ApprovalLevel;

  /** 審核人 */
  @Column('uuid', { nullable: true })
  approvedBy?: string;

  /** 審核時間 */
  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  /** 審核備註（退回原因等） */
  @Column({ type: 'text', nullable: true })
  approvalNote?: string;

  /** 預期交期 */
  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate?: Date;

  /** 交期預警天數 */
  @Column({ type: 'int', default: 3 })
  deliveryAlertDays!: number;

  /** 付款條件 */
  @Column({ nullable: true })
  paymentTerms?: string;

  /** 備註 */
  @Column({ type: 'text', nullable: true })
  note?: string;

  /** 建立人 */
  @Column('uuid', { nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
