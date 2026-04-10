import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentStatus, PaymentProvider } from '@layerframe/shared-types';

/** 付款方式 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  ATM = 'atm',
  CVS = 'cvs',           // 超商代碼
  BARCODE = 'barcode',    // 超商條碼
  LINEPAY = 'linepay',
  WEB_ATM = 'web_atm',
}

/** 金流交易記錄 — 每次付款/退款一筆 */
@Entity('payment_transactions')
@Index(['tenantId', 'orderId'])
@Index(['tenantId', 'createdAt'])
@Index(['transactionId'], { unique: true })
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 內部交易 ID（UUID） */
  @Column({ unique: true })
  transactionId!: string;

  @Column('uuid')
  orderId!: string;

  @Column()
  orderNumber!: string;

  /** 使用的金流商 */
  @Column({ type: 'varchar' })
  provider!: PaymentProvider;

  /** 付款方式 */
  @Column({ type: 'varchar', nullable: true })
  method?: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ default: 'TWD' })
  currency!: string;

  @Column({ type: 'varchar', default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  /** 金流商的交易編號 */
  @Column({ nullable: true })
  providerTransactionId?: string;

  /** 金流商回傳的原始資料 */
  @Column({ type: 'jsonb', nullable: true })
  rawResponse?: Record<string, unknown>;

  /** 退款金額 */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  refundAmount!: number;

  @Column({ nullable: true })
  failReason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
