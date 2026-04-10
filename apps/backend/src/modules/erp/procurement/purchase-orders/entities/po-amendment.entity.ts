import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/** PO 變更紀錄 */
@Entity('po_amendments')
@Index(['tenantId', 'purchaseOrderId'])
export class PoAmendment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  purchaseOrderId!: string;

  /** 變更前版本號 */
  @Column({ type: 'int' })
  fromVersion!: number;

  /** 變更後版本號 */
  @Column({ type: 'int' })
  toVersion!: number;

  /** 變更前快照 */
  @Column({ type: 'jsonb' })
  previousSnapshot!: Record<string, unknown>;

  /** 變更描述 */
  @Column({ type: 'text' })
  changeDescription!: string;

  /** 操作人 */
  @Column('uuid')
  changedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
