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

/** 產品分類 — 支援巢狀結構（parentId 指向上層分類） */
@Entity('categories')
@Index(['tenantId', 'slug'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column()
  name!: string;

  /** URL-safe 識別碼 */
  @Column()
  slug!: string;

  @Column({ nullable: true })
  description?: string;

  /** 上層分類（null = 頂層） */
  @Column('uuid', { nullable: true })
  parentId?: string;

  @ManyToOne(() => Category, (cat) => cat.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Category;

  @OneToMany(() => Category, (cat) => cat.parent)
  children?: Category[];

  @Column({ default: 0 })
  sortOrder!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
