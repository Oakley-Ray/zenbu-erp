import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/** 願望清單 */
@Entity('wishlists')
@Index(['tenantId', 'customerId', 'productId'], { unique: true })
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  customerId!: string;

  @Column('uuid')
  productId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
