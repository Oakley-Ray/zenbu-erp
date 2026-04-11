import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Resource } from './resource.entity';
import { WbsTask } from '../../wbs/entities/wbs-task.entity';

@Entity('resource_assignments')
@Index(['tenantId', 'taskId'])
@Index(['tenantId', 'resourceId'])
export class ResourceAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column('uuid')
  taskId!: string;

  @ManyToOne(() => WbsTask, (t) => t.resourceAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task?: WbsTask;

  @Column('uuid')
  resourceId!: string;

  @ManyToOne(() => Resource, (r) => r.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resourceId' })
  resource?: Resource;

  /** 數量 */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity!: number;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  /** 總成本 = quantity * resource.unitCost */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalCost!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
