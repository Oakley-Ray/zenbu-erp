import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** 商店設定 — 每個租戶一組，控制前台商店的外觀與行為 */
@Entity('store_settings')
@Index(['tenantId'], { unique: true })
export class StoreSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column({ default: 'My Store' })
  storeName!: string;

  @Column({ type: 'text', nullable: true })
  storeDescription?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  faviconUrl?: string;

  /** SEO */
  @Column({ nullable: true })
  metaTitle?: string;

  @Column({ type: 'text', nullable: true })
  metaDescription?: string;

  /** 主題色（覆蓋前端 Tailwind CSS 變數） */
  @Column({ type: 'jsonb', default: {} })
  theme!: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    bannerUrl?: string;
  };

  /** 商店政策 */
  @Column({ type: 'jsonb', default: {} })
  policies!: {
    shippingPolicy?: string;
    returnPolicy?: string;
    privacyPolicy?: string;
    termsOfService?: string;
  };

  /** 付款方式（啟用哪些金流） */
  @Column({ type: 'jsonb', default: [] })
  enabledPaymentMethods!: string[];

  /** 運送方式（啟用哪些物流商） */
  @Column({ type: 'jsonb', default: [] })
  enabledShippingMethods!: string[];

  /** 幣別 */
  @Column({ default: 'TWD' })
  currency!: string;

  /** 是否開放商店 */
  @Column({ default: false })
  isOpen!: boolean;

  /** 維護模式訊息 */
  @Column({ nullable: true })
  maintenanceMessage?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
