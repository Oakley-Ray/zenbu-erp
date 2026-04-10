import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** 運送區域類型 */
export enum CarrierZone {
  DOMESTIC = 'domestic',       // 台灣國內
  ASIA = 'asia',               // 亞洲
  NORTH_AMERICA = 'north_america',
  EUROPE = 'europe',
  OCEANIA = 'oceania',
  OTHER = 'other',
}

/** 計費模式 */
export enum PricingModel {
  PER_KG = 'per_kg',           // 按公斤計
  FLAT_RATE = 'flat_rate',     // 固定運費
  TIERED = 'tiered',           // 階梯式（0-5kg 一價、5-10kg 另一價）
}

/**
 * 物流商 — 每個租戶可設定自己合作的物流商及其費率。
 * 例如：DHL、FedEx、黑貓、7-11 超取。
 */
@Entity('carriers')
@Index(['tenantId', 'code'], { unique: true })
export class Carrier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 物流商代碼（如 dhl, fedex, tcat, seven_eleven） */
  @Column()
  code!: string;

  @Column()
  name!: string;

  /** 支援的區域 */
  @Column({ type: 'jsonb', default: [] })
  zones!: CarrierZone[];

  @Column({ type: 'varchar', default: PricingModel.PER_KG })
  pricingModel!: PricingModel;

  /**
   * 費率表 — 依計費模式解讀
   *
   * per_kg:    { "asia": 150, "europe": 280 }         → 每公斤費率（TWD）
   * flat_rate: { "domestic": 60, "asia": 500 }        → 固定費用
   * tiered:    { "domestic": [
   *               { "maxKg": 5, "price": 80 },
   *               { "maxKg": 10, "price": 120 },
   *               { "maxKg": null, "price": 180 }
   *             ] }                                    → 階梯式費率
   */
  @Column({ type: 'jsonb', default: {} })
  rates!: Record<string, unknown>;

  /** 材積重除數（DHL = 5000, FedEx = 5000, 部分海運 = 6000） */
  @Column({ type: 'int', default: 5000 })
  volumetricDivisor!: number;

  /** 最低收費（TWD） */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumCharge!: number;

  /** 預估配送天數 */
  @Column({ type: 'jsonb', default: {} })
  estimatedDays!: Record<string, { min: number; max: number }>;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
