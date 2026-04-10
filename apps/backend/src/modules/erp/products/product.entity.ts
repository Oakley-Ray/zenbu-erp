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
import { Category } from './category.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('products')
@Index(['tenantId', 'sku'], { unique: true })
@Index(['tenantId', 'status'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** SKU 庫存單位編號 — 同一租戶內唯一 */
  @Column()
  sku!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** 售價（用 decimal 避免浮點數誤差） */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  /** 成本價 */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPrice?: number;

  @Column({ default: 'TWD' })
  currency!: string;

  /** 產品分類 */
  @Column('uuid', { nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  /** 圖片 URL 清單 */
  @Column({ type: 'jsonb', default: [] })
  images!: string[];

  /** 產品屬性（顏色、尺寸等自訂欄位） */
  @Column({ type: 'jsonb', default: {} })
  attributes!: Record<string, unknown>;

  @Column({ type: 'varchar', default: ProductStatus.DRAFT })
  status!: ProductStatus;

  /** 重量（公斤），物流報價用 */
  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  weightKg?: number;

  /** 尺寸（公分） */
  @Column({ type: 'jsonb', nullable: true })
  dimensions?: { lengthCm: number; widthCm: number; heightCm: number };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
