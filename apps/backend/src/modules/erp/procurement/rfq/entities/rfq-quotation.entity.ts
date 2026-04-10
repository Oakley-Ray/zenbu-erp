import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RfqRequest } from './rfq-request.entity';

/** 供應商報價回覆 */
@Entity('rfq_quotations')
export class RfqQuotation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  rfqRequestId!: string;

  @ManyToOne(() => RfqRequest, (rfq) => rfq.quotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rfqRequestId' })
  rfqRequest?: RfqRequest;

  @Column('uuid')
  supplierId!: string;

  /** 供應商名稱（快照） */
  @Column()
  supplierName!: string;

  /** 逐項報價 */
  @Column({ type: 'jsonb' })
  lineItems!: Array<{
    rfqItemId: string;
    unitPrice: number;
    leadTimeDays: number;
    note?: string;
  }>;

  /** 報價總金額 */
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  totalAmount!: number;

  @Column({ default: 'TWD' })
  currency!: string;

  /** 交期（天） */
  @Column({ type: 'int', nullable: true })
  leadTimeDays?: number;

  /** 付款條件 */
  @Column({ nullable: true })
  paymentTerms?: string;

  /** 是否得標 */
  @Column({ default: false })
  isAwarded!: boolean;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  quotedAt!: Date;
}
