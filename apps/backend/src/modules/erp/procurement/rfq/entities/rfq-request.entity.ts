import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RfqStatus } from '@layerframe/shared-types';
import { RfqItem } from './rfq-item.entity';
import { RfqQuotation } from './rfq-quotation.entity';

/** 詢價單 */
@Entity('rfq_requests')
@Index(['tenantId', 'status'])
export class RfqRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 詢價單號 RFQ-YYYYMM-NNN */
  @Column({ unique: true })
  rfqNumber!: string;

  /** 標題 */
  @Column()
  title!: string;

  @OneToMany(() => RfqItem, (item) => item.rfqRequest, { cascade: true, eager: true })
  items!: RfqItem[];

  @OneToMany(() => RfqQuotation, (q) => q.rfqRequest, { cascade: true })
  quotations!: RfqQuotation[];

  /** 邀請的供應商 ID 列表 */
  @Column({ type: 'jsonb', default: [] })
  invitedSupplierIds!: string[];

  @Column({ type: 'varchar', default: RfqStatus.DRAFT })
  status!: RfqStatus;

  /** 報價截止日 */
  @Column({ type: 'date', nullable: true })
  deadline?: Date;

  /** 得標供應商 */
  @Column('uuid', { nullable: true })
  awardedSupplierId?: string;

  /** 建立人 */
  @Column('uuid', { nullable: true })
  createdBy?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
