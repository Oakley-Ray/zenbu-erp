import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { OrderStatus, PaymentStatus } from '@layerframe/shared-types';
import { OrderItem } from './order-item.entity';

@Entity('orders')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 訂單編號（人類可讀，如 ORD-20260405-001） */
  @Column({ unique: true })
  orderNumber!: string;

  /** 下單客戶 */
  @Column('uuid', { nullable: true })
  customerId?: string;

  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  customerEmail?: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items!: OrderItem[];

  /** 小計（商品總額） */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal!: number;

  /** 運費 */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  shippingFee!: number;

  /** 折扣 */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount!: number;

  /** 總金額 = subtotal + shippingFee - discount */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ default: 'TWD' })
  currency!: string;

  @Column({ type: 'varchar', default: OrderStatus.DRAFT })
  status!: OrderStatus;

  @Column({ type: 'varchar', default: PaymentStatus.PENDING })
  paymentStatus!: PaymentStatus;

  /** 收件資訊 */
  @Column({ type: 'jsonb', nullable: true })
  shippingAddress?: {
    name: string;
    phone: string;
    address: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };

  @Column({ type: 'text', nullable: true })
  note?: string;

  /** 操作人（建立此訂單的員工） */
  @Column('uuid', { nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
