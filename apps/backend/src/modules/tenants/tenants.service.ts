import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  async create(dto: { name: string; slug: string; customDomain?: string; theme?: Record<string, string> }): Promise<Tenant> {
    const exists = await this.repo.findOne({ where: [{ slug: dto.slug }, { name: dto.name }] });
    if (exists) {
      throw new ConflictException('租戶名稱或 slug 已存在');
    }
    const tenant = this.repo.create(dto);
    return this.repo.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.repo.find({ where: { isActive: true } });
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('租戶不存在');
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { slug, isActive: true } });
  }

  async update(id: string, dto: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findById(id);
    Object.assign(tenant, dto);
    return this.repo.save(tenant);
  }

  async deactivate(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.update(id, { isActive: false });
  }
}
