import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SupplierStatus, InspectionType } from '@layerframe/shared-types';

/** 供應商 */
@Entity('suppliers')
@Index(['tenantId', 'status'])
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 供應商編號 */
  @Column({ unique: true })
  supplierCode!: string;

  @Column()
  name!: string;

  /** 聯絡人 */
  @Column({ nullable: true })
  contactPerson?: string;

  @Column({ nullable: true })
  contactEmail?: string;

  @Column({ nullable: true })
  contactPhone?: string;

  /** 地址 */
  @Column({ nullable: true })
  address?: string;

  /** 統一編號 / Tax ID */
  @Column({ nullable: true })
  taxId?: string;

  /** 付款條件（如 NET30, NET60） */
  @Column({ nullable: true })
  paymentTerms?: string;

  @Column({ type: 'varchar', default: SupplierStatus.ACTIVE })
  status!: SupplierStatus;

  /** 預設品檢類型 */
  @Column({ type: 'varchar', default: InspectionType.SAMPLING })
  defaultInspectionType!: InspectionType;

  /** 交期達成率 (0~100) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  deliveryScore!: number;

  /** 品質合格率 (0~100) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  qualityScore!: number;

  /** 綜合評分 (0~100) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  overallScore!: number;

  /** 黑名單原因 */
  @Column({ type: 'text', nullable: true })
  blacklistReason?: string;

  /** 備註 */
  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
