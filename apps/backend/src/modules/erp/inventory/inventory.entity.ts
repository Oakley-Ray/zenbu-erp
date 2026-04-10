import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';

/** 庫存 — 每個產品在每個倉庫的數量 */
@Entity('inventory')
@Unique(['tenantId', 'productId', 'warehouse'])
@Index(['tenantId', 'warehouse'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column('uuid')
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  /** 倉庫名稱（如 main、taipei-wh、taichung-wh） */
  @Column({ default: 'main' })
  warehouse!: string;

  /** 目前庫存數量 */
  @Column({ type: 'int', default: 0 })
  quantity!: number;

  /** 安全庫存量 — 低於此值觸發警告 */
  @Column({ type: 'int', default: 0 })
  safetyStock!: number;

  /** 已預留（被訂單鎖定但尚未出貨） */
  @Column({ type: 'int', default: 0 })
  reserved!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /** 可用庫存 = 數量 - 已預留 */
  get available(): number {
    return this.quantity - this.reserved;
  }

  /** 是否低於安全庫存 */
  get isLowStock(): boolean {
    return this.quantity <= this.safetyStock;
  }
}
