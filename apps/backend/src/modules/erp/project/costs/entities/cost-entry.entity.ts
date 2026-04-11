import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CostCategory } from '@layerframe/shared-types';
import { Project } from '../../projects/entities/project.entity';

@Entity('project_cost_entries')
@Index(['tenantId', 'projectId'])
export class CostEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column('uuid')
  projectId!: string;

  @ManyToOne(() => Project, (p) => p.costEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project?: Project;

  /** 關聯的 WBS 任務（可選） */
  @Column('uuid', { nullable: true })
  taskId?: string;

  @Column({ type: 'varchar' })
  category!: CostCategory;

  @Column()
  description!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  date!: Date;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
