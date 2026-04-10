import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentProvider } from '@layerframe/shared-types';

/**
 * 租戶金流設定 — 每個租戶各自的金流商 API key。
 * 敏感欄位（HashKey、Secret）使用 AES-256-GCM 加密儲存。
 */
@Entity('payment_configs')
@Index(['tenantId', 'provider'], { unique: true })
export class PaymentConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ type: 'varchar' })
  provider!: PaymentProvider;

  /** 加密儲存的設定（JSON stringify → AES-256-GCM encrypt → Base64） */
  @Column({ type: 'text' })
  encryptedConfig!: string;

  @Column({ default: false })
  isActive!: boolean;

  /** 是否為測試模式 */
  @Column({ default: true })
  isSandbox!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
