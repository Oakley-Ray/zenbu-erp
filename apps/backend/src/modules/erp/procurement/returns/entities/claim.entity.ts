import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ClaimStatus } from '@layerframe/shared-types';

/** 索賠單 */
@Entity('claims')
@Index(['tenantId', 'supplierId'])
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 索賠單號 CLM-YYYYMMDD-NNN */
  @Column({ unique: true })
  claimNumber!: string;

  @Column('uuid')
  supplierId!: string;

  /** 關聯退貨單（可選，索賠不一定伴隨退貨） */
  @Column('uuid', { nullable: true })
  purchaseReturnId?: string;

  /** 關聯採購單 */
  @Column('uuid', { nullable: true })
  purchaseOrderId?: string;

  /** 索賠類型 */
  @Column()
  claimType!: string; // quality_defect, late_delivery, shortage, other

  /** 索賠金額 */
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ default: 'TWD' })
  currency!: string;

  /** 金額計算方式說明 */
  @Column({ type: 'text', nullable: true })
  amountCalculation?: string;

  @Column({ type: 'varchar', default: ClaimStatus.PENDING })
  status!: ClaimStatus;

  /** 供應商回覆 */
  @Column({ type: 'text', nullable: true })
  supplierResponse?: string;

  /** 最終確認金額（協商後） */
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  settledAmount?: number;

  /** 沖帳紀錄 ID（連動應付帳款） */
  @Column({ nullable: true })
  offsetReference?: string;

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
