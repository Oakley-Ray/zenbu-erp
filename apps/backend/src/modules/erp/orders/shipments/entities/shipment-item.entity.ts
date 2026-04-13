import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Shipment } from './shipment.entity';

@Entity('shipment_items')
export class ShipmentItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  shipmentId!: string;

  @ManyToOne(() => Shipment, (s) => s.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipmentId' })
  shipment?: Shipment;

  @Column('uuid')
  orderItemId!: string;

  @Column('uuid')
  productId!: string;

  @Column()
  productName!: string;

  @Column({ nullable: true })
  sku?: string;

  /** 本次出貨數量（可能部分出貨） */
  @Column({ type: 'int' })
  quantity!: number;
}
