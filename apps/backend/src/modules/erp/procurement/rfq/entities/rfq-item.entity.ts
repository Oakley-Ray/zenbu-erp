import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RfqRequest } from './rfq-request.entity';

/** 詢價單明細 */
@Entity('rfq_items')
export class RfqItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  rfqRequestId!: string;

  @ManyToOne(() => RfqRequest, (rfq) => rfq.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rfqRequestId' })
  rfqRequest?: RfqRequest;

  @Column('uuid', { nullable: true })
  productId?: string;

  @Column()
  productName!: string;

  @Column({ nullable: true })
  sku?: string;

  @Column({ nullable: true })
  specification?: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ default: 'pcs' })
  unit!: string;
}
