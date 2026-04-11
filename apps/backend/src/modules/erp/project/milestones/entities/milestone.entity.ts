import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MilestoneStatus } from '@layerframe/shared-types';
import { Project } from '../../projects/entities/project.entity';

@Entity('project_milestones')
@Index(['tenantId', 'projectId'])
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column('uuid')
  projectId!: string;

  @ManyToOne(() => Project, (p) => p.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project?: Project;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date' })
  dueDate!: Date;

  @Column({ type: 'date', nullable: true })
  achievedDate?: Date;

  @Column({ type: 'varchar', default: MilestoneStatus.PENDING })
  status!: MilestoneStatus;

  /** 交付物描述列表 */
  @Column({ type: 'jsonb', default: [] })
  deliverables!: { name: string; description?: string; completed: boolean }[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
