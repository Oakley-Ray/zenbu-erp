import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { TenantRole, PlatformRole } from '@layerframe/shared-types';

@Entity('users')
@Unique(['email', 'tenantId']) // 同一租戶內 email 唯一
@Index(['tenantId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column()
  email!: string;

  @Column()
  name!: string;

  /** bcrypt hash，永遠不會出現在 API response 中 */
  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', default: TenantRole.VIEWER })
  role!: TenantRole | PlatformRole;

  @Column({ default: true })
  isActive!: boolean;

  /** MFA TOTP secret（加密儲存） */
  @Column({ nullable: true, select: false })
  mfaSecret?: string;

  @Column({ default: false })
  mfaEnabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
