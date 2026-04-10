import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockMovementType } from '@layerframe/shared-types';
import { Product } from '../products/product.entity';

/** 庫存異動記錄 — 每次進出貨、調整、移轉都留一筆 */
@Entity('stock_movements')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'productId'])
export class StockMovement {
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

  @Column({ type: 'varchar' })
  type!: StockMovementType;

  /** 異動數量（正數 = 增加，負數 = 減少） */
  @Column({ type: 'int' })
  quantity!: number;

  /** 來源倉庫（移轉時使用） */
  @Column({ default: 'main' })
  warehouse!: string;

  /** 目標倉庫（移轉時使用） */
  @Column({ nullable: true })
  toWarehouse?: string;

  /** 關聯單據（訂單 ID、採購單 ID 等） */
  @Column({ nullable: true })
  referenceId?: string;

  @Column({ nullable: true })
  referenceType?: string;

  @Column({ nullable: true })
  note?: string;

  /** 操作人 */
  @Column('uuid', { nullable: true })
  operatorId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
