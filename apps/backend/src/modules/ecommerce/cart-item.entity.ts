import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Cart } from './cart.entity';

@Entity('cart_items')
@Index(['cartId', 'productId'], { unique: true })
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  cartId!: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart?: Cart;

  @Column('uuid')
  productId!: string;

  /** 快照：加入購物車時的產品名 */
  @Column()
  productName!: string;

  /** 快照：加入購物車時的圖片 */
  @Column({ nullable: true })
  productImage?: string;

  /** 快照：加入購物車時的單價 */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: number;

  @Column({ type: 'int', default: 1 })
  quantity!: number;
}
