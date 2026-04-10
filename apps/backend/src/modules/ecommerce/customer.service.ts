import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Customer, CustomerAddress } from './customer.entity';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  async register(tenantId: string, dto: {
    email: string;
    name: string;
    password?: string;
    phone?: string;
  }): Promise<Customer> {
    const exists = await this.repo.findOne({ where: { tenantId, email: dto.email } });
    if (exists) throw new ConflictException('此 email 已註冊');

    const customer = this.repo.create({
      tenantId,
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, BCRYPT_ROUNDS) : undefined,
    });
    return this.repo.save(customer);
  }

  async findByEmail(tenantId: string, email: string): Promise<Customer | null> {
    return this.repo.findOne({
      where: { tenantId, email },
      select: ['id', 'tenantId', 'email', 'name', 'phone', 'passwordHash', 'isActive', 'addresses'],
    });
  }

  async findById(tenantId: string, id: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id, tenantId } });
    if (!customer) throw new NotFoundException('顧客不存在');
    return customer;
  }

  async findAll(tenantId: string, opts?: { page?: number; limit?: number }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const [data, total] = await this.repo.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async update(tenantId: string, id: string, dto: { name?: string; phone?: string }): Promise<Customer> {
    const customer = await this.findById(tenantId, id);
    if (dto.name) customer.name = dto.name;
    if (dto.phone) customer.phone = dto.phone;
    return this.repo.save(customer);
  }

  /** 新增收件地址 */
  async addAddress(tenantId: string, customerId: string, address: Omit<CustomerAddress, 'id'>): Promise<Customer> {
    const customer = await this.findById(tenantId, customerId);
    const newAddr: CustomerAddress = {
      ...address,
      id: crypto.randomUUID(),
    };

    // 如果設為預設，把其他的取消
    if (newAddr.isDefault) {
      customer.addresses.forEach((a) => (a.isDefault = false));
    }

    customer.addresses.push(newAddr);
    return this.repo.save(customer);
  }

  /** 刪除收件地址 */
  async removeAddress(tenantId: string, customerId: string, addressId: string): Promise<Customer> {
    const customer = await this.findById(tenantId, customerId);
    customer.addresses = customer.addresses.filter((a) => a.id !== addressId);
    return this.repo.save(customer);
  }

  /** 累加訂單統計 */
  async addOrderStats(tenantId: string, customerId: string, amount: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(Customer)
      .set({
        totalSpent: () => `"totalSpent" + ${amount}`,
        orderCount: () => `"orderCount" + 1`,
      })
      .where('id = :id AND tenantId = :tenantId', { id: customerId, tenantId })
      .execute();
  }

  /** 驗證顧客密碼（登入用） */
  async validatePassword(tenantId: string, email: string, password: string): Promise<Customer | null> {
    const customer = await this.findByEmail(tenantId, email);
    if (!customer?.passwordHash || !customer.isActive) return null;

    const valid = await bcrypt.compare(password, customer.passwordHash);
    return valid ? customer : null;
  }
}
