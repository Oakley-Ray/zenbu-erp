import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

/** 顧客排行（VIP / 高消費顧客） */
@Entity('customer_rankings')
@Index(['tenantId', 'period', 'periodValue'])
export class CustomerRanking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column()
  period!: string;

  @Column()
  periodValue!: string;

  @Column('uuid')
  customerId!: string;

  @Column()
  customerName!: string;

  @Column({ nullable: true })
  customerEmail?: string;

  /** 消費金額 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalSpent!: number;

  /** 訂單數 */
  @Column({ type: 'int', default: 0 })
  orderCount!: number;

  @Column({ type: 'int', default: 0 })
  rank!: number;
}
