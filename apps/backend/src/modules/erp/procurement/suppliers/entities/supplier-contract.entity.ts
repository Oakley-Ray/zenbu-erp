import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Supplier } from './supplier.entity';

/** 供應商合約 */
@Entity('supplier_contracts')
@Index(['tenantId', 'supplierId'])
export class SupplierContract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  supplierId!: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  /** 合約編號 */
  @Column()
  contractNumber!: string;

  @Column({ nullable: true })
  title?: string;

  /** 合約開始日期 */
  @Column({ type: 'date' })
  startDate!: Date;

  /** 合約結束日期 */
  @Column({ type: 'date' })
  endDate!: Date;

  /** 合約金額 */
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  amount?: number;

  @Column({ default: 'TWD' })
  currency!: string;

  /** 合約條款/附件 URL */
  @Column({ type: 'jsonb', nullable: true })
  attachments?: string[];

  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
