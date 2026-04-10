import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { CartItem } from './cart-item.entity';

/**
 * 購物車 — 一個顧客在一個租戶下有一個購物車。
 * 支援登入購物車和訪客購物車（透過 sessionId）。
 */
@Entity('carts')
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'sessionId'])
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 登入顧客（二選一） */
  @Column('uuid', { nullable: true })
  customerId?: string;

  /** 訪客 session（二選一） */
  @Column({ nullable: true })
  sessionId?: string;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true, eager: true })
  items!: CartItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
