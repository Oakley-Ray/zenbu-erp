import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseReturn } from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';
import { Claim } from './entities/claim.entity';
import { CreateReturnDto, CreateClaimDto } from './dto/create-return.dto';
import { ClaimStatus } from '@layerframe/shared-types';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(PurchaseReturn)
    private readonly returnRepo: Repository<PurchaseReturn>,
    @InjectRepository(PurchaseReturnItem)
    private readonly returnItemRepo: Repository<PurchaseReturnItem>,
    @InjectRepository(Claim)
    private readonly claimRepo: Repository<Claim>,
  ) {}

  // ─── 退貨 ───

  async createReturn(tenantId: string, dto: CreateReturnDto, createdBy?: string): Promise<PurchaseReturn> {
    const items = dto.items.map((itemDto) => {
      const subtotal = itemDto.unitPrice * itemDto.returnQty;
      return this.returnItemRepo.create({
        productId: itemDto.productId,
        productName: itemDto.productName,
        sku: itemDto.sku,
        returnQty: itemDto.returnQty,
        unitPrice: itemDto.unitPrice,
        subtotal,
        reason: itemDto.reason,
        photos: itemDto.photos,
        note: itemDto.note,
      });
    });

    const totalAmount = items.reduce((sum, i) => sum + Number(i.subtotal), 0);

    const pr = this.returnRepo.create({
      tenantId,
      returnNumber: await this.generateNumber(tenantId, 'PR'),
      purchaseOrderId: dto.purchaseOrderId,
      goodsReceiptId: dto.goodsReceiptId,
      supplierId: dto.supplierId,
      items,
      totalAmount,
      createdBy,
      note: dto.note,
    });

    return this.returnRepo.save(pr);
  }

  async findAllReturns(tenantId: string, opts?: {
    page?: number;
    limit?: number;
    supplierId?: string;
  }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.returnRepo
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.items', 'items')
      .where('pr.tenantId = :tenantId', { tenantId })
      .orderBy('pr.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.supplierId) {
      qb.andWhere('pr.supplierId = :supplierId', { supplierId: opts.supplierId });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findReturnById(tenantId: string, id: string): Promise<PurchaseReturn> {
    const pr = await this.returnRepo.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });
    if (!pr) throw new NotFoundException('退貨單不存在');
    return pr;
  }

  async updateReturnStatus(tenantId: string, id: string, status: string): Promise<PurchaseReturn> {
    const pr = await this.findReturnById(tenantId, id);
    pr.status = status;
    return this.returnRepo.save(pr);
  }

  // ─── 索賠 ───

  async createClaim(tenantId: string, dto: CreateClaimDto, createdBy?: string): Promise<Claim> {
    const claim = this.claimRepo.create({
      tenantId,
      claimNumber: await this.generateNumber(tenantId, 'CLM'),
      supplierId: dto.supplierId,
      purchaseReturnId: dto.purchaseReturnId,
      purchaseOrderId: dto.purchaseOrderId,
      claimType: dto.claimType,
      amount: dto.amount,
      amountCalculation: dto.amountCalculation,
      createdBy,
      note: dto.note,
    });
    return this.claimRepo.save(claim);
  }

  async findAllClaims(tenantId: string, opts?: {
    page?: number;
    limit?: number;
    supplierId?: string;
    status?: ClaimStatus;
  }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.claimRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.supplierId) {
      qb.andWhere('c.supplierId = :supplierId', { supplierId: opts.supplierId });
    }
    if (opts?.status) {
      qb.andWhere('c.status = :status', { status: opts.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findClaimById(tenantId: string, id: string): Promise<Claim> {
    const claim = await this.claimRepo.findOne({ where: { id, tenantId } });
    if (!claim) throw new NotFoundException('索賠單不存在');
    return claim;
  }

  async updateClaimStatus(
    tenantId: string,
    id: string,
    status: ClaimStatus,
    data?: { supplierResponse?: string; settledAmount?: number; offsetReference?: string },
  ): Promise<Claim> {
    const claim = await this.findClaimById(tenantId, id);
    claim.status = status;
    if (data?.supplierResponse) claim.supplierResponse = data.supplierResponse;
    if (data?.settledAmount !== undefined) claim.settledAmount = data.settledAmount;
    if (data?.offsetReference) claim.offsetReference = data.offsetReference;
    return this.claimRepo.save(claim);
  }

  // ── 內部方法 ──

  private async generateNumber(tenantId: string, prefix: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fullPrefix = `${prefix}-${today}`;

    const repo = prefix === 'PR' ? this.returnRepo : this.claimRepo;
    const field = prefix === 'PR' ? 'returnNumber' : 'claimNumber';
    const alias = prefix === 'PR' ? 'pr' : 'c';

    const count = await repo
      .createQueryBuilder(alias)
      .where(`${alias}.tenantId = :tenantId`, { tenantId })
      .andWhere(`${alias}.${field} LIKE :prefix`, { prefix: `${fullPrefix}%` })
      .getCount();

    return `${fullPrefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
