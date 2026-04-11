import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TaskStatus } from '@layerframe/shared-types';
import { Project } from '../../projects/entities/project.entity';
import { ResourceAssignment } from '../../resources/entities/resource-assignment.entity';

@Entity('wbs_tasks')
@Index(['tenantId', 'projectId'])
@Index(['tenantId', 'path'])
export class WbsTask {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column('uuid')
  projectId!: string;

  @ManyToOne(() => Project, (p) => p.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project?: Project;

  /** 父任務 */
  @Column('uuid', { nullable: true })
  parentId?: string;

  @ManyToOne(() => WbsTask, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent?: WbsTask;

  @OneToMany(() => WbsTask, (t) => t.parent)
  children?: WbsTask[];

  /** Materialized path: "1.2.3" — 用於快速查子樹 */
  @Column({ default: '' })
  path!: string;

  /** 樹深度 0-based */
  @Column({ type: 'int', default: 0 })
  level!: number;

  /** 同層排序 */
  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  /** WBS 編碼 (1.2.3) */
  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', default: TaskStatus.NOT_STARTED })
  status!: TaskStatus;

  @Column({ type: 'date', nullable: true })
  plannedStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  plannedEndDate?: Date;

  @Column({ type: 'date', nullable: true })
  actualStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  actualEndDate?: Date;

  /** 計劃工時 */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  plannedHours!: number;

  /** 實際工時 */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  actualHours!: number;

  /** 計劃成本 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  plannedCost!: number;

  /** 實際成本 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  actualCost!: number;

  /** 負責人 */
  @Column('uuid', { nullable: true })
  assigneeId?: string;

  /** 進度 0-100 */
  @Column({ type: 'int', default: 0 })
  progress!: number;

  /** 任務依賴（前置任務 ID 列表） */
  @Column({ type: 'jsonb', default: [] })
  dependencies!: string[];

  @OneToMany(() => ResourceAssignment, (ra) => ra.task)
  resourceAssignments?: ResourceAssignment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
