import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { TenantRole } from '@layerframe/shared-types';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(dto: {
    email: string;
    password: string;
    name: string;
    tenantId: string;
    role?: TenantRole;
  }): Promise<User> {
    const exists = await this.repo.findOne({
      where: { email: dto.email, tenantId: dto.tenantId },
    });
    if (exists) {
      throw new ConflictException('此 email 在該租戶中已存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.repo.create({
      email: dto.email,
      name: dto.name,
      tenantId: dto.tenantId,
      role: dto.role ?? TenantRole.VIEWER,
      passwordHash,
    });
    return this.repo.save(user);
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email, tenantId },
      select: ['id', 'email', 'name', 'tenantId', 'role', 'isActive', 'passwordHash', 'mfaEnabled'],
    });
  }

  async findById(id: string, tenantId: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('使用者不存在');
    return user;
  }

  async findAllByTenant(tenantId: string): Promise<User[]> {
    return this.repo.find({ where: { tenantId } });
  }

  async update(
    id: string,
    tenantId: string,
    dto: { name?: string; password?: string; role?: TenantRole; isActive?: boolean },
  ): Promise<User> {
    const user = await this.findById(id, tenantId);

    if (dto.name) user.name = dto.name;
    if (dto.role) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    return this.repo.save(user);
  }

  async deactivate(id: string, tenantId: string): Promise<void> {
    const user = await this.findById(id, tenantId);
    user.isActive = false;
    await this.repo.save(user);
  }
}
