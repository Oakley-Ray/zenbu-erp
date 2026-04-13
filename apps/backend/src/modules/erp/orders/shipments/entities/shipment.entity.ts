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
import { ShipmentStatus } from '@layerframe/shared-types';
import { Order } from '../../order.entity';
import { ShipmentItem } from './shipment-item.entity';

@Entity('shipments')
@Index(['tenantId', 'orderId'])
@Index(['tenantId', 'status'])
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 出貨單號 SHP-YYYYMMDD-NNN */
  @Column({ unique: true })
  shipmentNumber!: string;

  @Column('uuid')
  orderId!: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order?: Order;

  @OneToMany(() => ShipmentItem, (item) => item.shipment, { cascade: true, eager: true })
  items!: ShipmentItem[];

  @Column({ type: 'varchar', default: ShipmentStatus.PENDING })
  status!: ShipmentStatus;

  /** 收件人 */
  @Column()
  recipientName!: string;

  @Column()
  recipientPhone!: string;

  @Column()
  recipientAddress!: string;

  /** 物流商 */
  @Column({ nullable: true })
  carrier?: string;

  /** 物流方式（宅配/超商取貨/自取） */
  @Column({ default: 'delivery' })
  shippingMethod!: string;

  /** 追蹤號碼 */
  @Column({ nullable: true })
  trackingNumber?: string;

  /** 追蹤連結 */
  @Column({ nullable: true })
  trackingUrl?: string;

  /** 預計出貨日 */
  @Column({ type: 'date', nullable: true })
  estimatedShipDate?: Date;

  /** 實際出貨日 */
  @Column({ type: 'timestamptz', nullable: true })
  shippedAt?: Date;

  /** 送達日 */
  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  /** 備註 */
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
