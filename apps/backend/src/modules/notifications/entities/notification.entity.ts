import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type NotificationType =
  | 'project_status_changed'
  | 'task_assigned'
  | 'task_completed'
  | 'milestone_due'
  | 'milestone_achieved'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'resource_conflict'
  | 'general';

@Entity('notifications')
@Index(['tenantId', 'userId', 'read'])
@Index(['tenantId', 'userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 通知對象 */
  @Column('uuid')
  userId!: string;

  @Column({ type: 'varchar', default: 'general' })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  /** 點擊後跳轉的路徑 */
  @Column({ nullable: true })
  link?: string;

  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
