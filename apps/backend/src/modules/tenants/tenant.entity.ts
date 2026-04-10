import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  /** URL-safe 識別碼，用於子網域或路徑 */
  @Column({ unique: true })
  slug!: string;

  @Column({ nullable: true })
  customDomain?: string;

  @Column({ type: 'jsonb', default: {} })
  theme!: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    logoUrl?: string;
  };

  @Column({ type: 'jsonb', default: { modules: { erp: true, logistics: false, ecommerce: false, analytics: false }, features: { offlineSync: false, mfa: false, customDomain: false } } })
  config!: {
    modules: { erp: boolean; logistics: boolean; ecommerce: boolean; analytics: boolean };
    features: { offlineSync: boolean; mfa: boolean; customDomain: boolean };
  };

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
