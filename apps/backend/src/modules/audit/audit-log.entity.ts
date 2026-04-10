import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuditAction } from '@layerframe/shared-types';

@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid', { nullable: true })
  userId?: string;

  @Column({ type: 'varchar' })
  action!: AuditAction;

  /** 操作的資源類型（如 user, order, product） */
  @Column()
  resource!: string;

  /** 資源 ID */
  @Column({ nullable: true })
  resourceId?: string;

  /** 變更前的值（JSON） */
  @Column({ type: 'jsonb', nullable: true })
  oldValue?: Record<string, unknown>;

  /** 變更後的值（JSON） */
  @Column({ type: 'jsonb', nullable: true })
  newValue?: Record<string, unknown>;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
