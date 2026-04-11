import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ResourceType } from '@layerframe/shared-types';
import { ResourceAssignment } from './resource-assignment.entity';

@Entity('project_resources')
@Index(['tenantId', 'type'])
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar' })
  type!: ResourceType;

  /** 計量單位 (人時/台時/kg 等) */
  @Column({ default: 'hour' })
  unit!: string;

  /** 單位成本 */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  unitCost!: number;

  @Column({ default: true })
  available!: boolean;

  @OneToMany(() => ResourceAssignment, (ra) => ra.resource)
  assignments?: ResourceAssignment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
