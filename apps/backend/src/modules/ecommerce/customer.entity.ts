import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** 收件地址 */
export interface CustomerAddress {
  id: string;
  label: string;       // 「家裡」「公司」
  name: string;
  phone: string;
  address: string;
  city?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}

/** 電商顧客 — 與 User 分開，因為顧客不一定要有後台帳號 */
@Entity('customers')
@Index(['tenantId', 'email'], { unique: true })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  phone?: string;

  /** 密碼 hash（選填，支援訪客結帳） */
  @Column({ nullable: true, select: false })
  passwordHash?: string;

  /** 收件地址簿 */
  @Column({ type: 'jsonb', default: [] })
  addresses!: CustomerAddress[];

  /** 累積消費金額 */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSpent!: number;

  /** 訂單數 */
  @Column({ type: 'int', default: 0 })
  orderCount!: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
