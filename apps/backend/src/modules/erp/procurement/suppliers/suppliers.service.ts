import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { SupplierContract } from './entities/supplier-contract.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierStatus } from '@layerframe/shared-types';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(SupplierContract)
    private readonly contractRepo: Repository<SupplierContract>,
  ) {}

  // ─── 供應商 CRUD ───

  async create(tenantId: string, dto: CreateSupplierDto): Promise<Supplier> {
    const exists = await this.supplierRepo.findOne({
      where: { tenantId, supplierCode: dto.supplierCode },
    });
    if (exists) throw new ConflictException(`供應商編號 ${dto.supplierCode} 已存在`);

    const supplier = this.supplierRepo.create({ tenantId, ...dto });
    return this.supplierRepo.save(supplier);
  }

  async findAll(tenantId: string, opts?: {
    page?: number;
    limit?: number;
    status?: SupplierStatus;
    search?: string;
  }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.supplierRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.status) {
      qb.andWhere('s.status = :status', { status: opts.status });
    }
    if (opts?.search) {
      qb.andWhere('(s.name ILIKE :q OR s.supplierCode ILIKE :q)', { q: `%${opts.search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(tenantId: string, id: string): Promise<Supplier> {
    const supplier = await this.supplierRepo.findOne({ where: { id, tenantId } });
    if (!supplier) throw new NotFoundException('供應商不存在');
    return supplier;
  }

  async update(tenantId: string, id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findById(tenantId, id);

    // 加入黑名單時必須填理由
    if (dto.status === SupplierStatus.BLACKLISTED && !dto.blacklistReason && !supplier.blacklistReason) {
      throw new BadRequestException('列入黑名單必須提供原因');
    }

    // 重算綜合評分
    if (dto.deliveryScore !== undefined || dto.qualityScore !== undefined) {
      const delivery = dto.deliveryScore ?? Number(supplier.deliveryScore);
      const quality = dto.qualityScore ?? Number(supplier.qualityScore);
      (dto as Record<string, unknown>).overallScore = delivery * 0.4 + quality * 0.6;
    }

    Object.assign(supplier, dto);
    return this.supplierRepo.save(supplier);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const supplier = await this.findById(tenantId, id);
    await this.supplierRepo.remove(supplier);
  }

  /** 更新供應商評分（由收貨/品檢觸發） */
  async updateScores(
    tenantId: string,
    supplierId: string,
    scores: { deliveryScore?: number; qualityScore?: number },
  ): Promise<void> {
    const supplier = await this.findById(tenantId, supplierId);
    if (scores.deliveryScore !== undefined) supplier.deliveryScore = scores.deliveryScore;
    if (scores.qualityScore !== undefined) supplier.qualityScore = scores.qualityScore;
    supplier.overallScore = Number(supplier.deliveryScore) * 0.4 + Number(supplier.qualityScore) * 0.6;
    await this.supplierRepo.save(supplier);
  }

  // ─── 合約管理 ───

  async createContract(
    tenantId: string,
    supplierId: string,
    data: Partial<SupplierContract>,
  ): Promise<SupplierContract> {
    await this.findById(tenantId, supplierId);
    const contract = this.contractRepo.create({ tenantId, supplierId, ...data });
    return this.contractRepo.save(contract);
  }

  async findContracts(tenantId: string, supplierId: string): Promise<SupplierContract[]> {
    return this.contractRepo.find({
      where: { tenantId, supplierId },
      order: { endDate: 'DESC' },
    });
  }

  async deleteContract(tenantId: string, contractId: string): Promise<void> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId, tenantId },
    });
    if (!contract) throw new NotFoundException('合約不存在');
    await this.contractRepo.remove(contract);
  }
}
