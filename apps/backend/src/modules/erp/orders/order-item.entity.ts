import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order?: Order;

  @Column('uuid')
  productId!: string;

  @Column()
  productName!: string;

  @Column({ nullable: true })
  sku?: string;

  /** 單價（下單時的快照，不隨產品改價而變動） */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: number;

  @Column({ type: 'int' })
  quantity!: number;

  /** 小計 = unitPrice * quantity */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;
}
