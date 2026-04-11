import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ProjectStatus } from '@layerframe/shared-types';
import { WbsTask } from '../../wbs/entities/wbs-task.entity';
import { Milestone } from '../../milestones/entities/milestone.entity';
import { CostEntry } from '../../costs/entities/cost-entry.entity';

@Entity('projects')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'createdAt'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  /** 專案編號 PRJ-YYYYMM-NNN */
  @Column({ unique: true })
  projectCode!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', default: ProjectStatus.PLANNING })
  status!: ProjectStatus;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  /** 預算 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  budget!: number;

  /** 實際成本（由 cost entries 彙總） */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  actualCost!: number;

  /** 整體進度 0-100 */
  @Column({ type: 'int', default: 0 })
  progress!: number;

  /** 專案經理 */
  @Column('uuid', { nullable: true })
  managerId?: string;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @OneToMany(() => WbsTask, (task) => task.project)
  tasks?: WbsTask[];

  @OneToMany(() => Milestone, (m) => m.project)
  milestones?: Milestone[];

  @OneToMany(() => CostEntry, (c) => c.project)
  costEntries?: CostEntry[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
