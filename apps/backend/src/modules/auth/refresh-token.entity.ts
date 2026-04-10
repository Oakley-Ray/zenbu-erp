import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** 不透明 token 值（儲存 hash，不存明文） */
  @Column({ unique: true })
  tokenHash!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  /** 是否已被使用（用過即作廢，實現 rotation） */
  @Column({ default: false })
  isRevoked!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
