import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RfqRequest } from './entities/rfq-request.entity';
import { RfqItem } from './entities/rfq-item.entity';
import { RfqQuotation } from './entities/rfq-quotation.entity';
import { CreateRfqDto, SubmitQuotationDto } from './dto/create-rfq.dto';
import { RfqStatus } from '@layerframe/shared-types';

@Injectable()
export class RfqService {
  constructor(
    @InjectRepository(RfqRequest)
    private readonly rfqRepo: Repository<RfqRequest>,
    @InjectRepository(RfqItem)
    private readonly rfqItemRepo: Repository<RfqItem>,
    @InjectRepository(RfqQuotation)
    private readonly quotationRepo: Repository<RfqQuotation>,
  ) {}

  async create(tenantId: string, dto: CreateRfqDto, createdBy?: string): Promise<RfqRequest> {
    const items = dto.items.map((itemDto) =>
      this.rfqItemRepo.create({
        productId: itemDto.productId,
        productName: itemDto.productName,
        sku: itemDto.sku,
        specification: itemDto.specification,
        quantity: itemDto.quantity,
        unit: itemDto.unit ?? 'pcs',
      }),
    );

    const rfq = this.rfqRepo.create({
      tenantId,
      rfqNumber: await this.generateRfqNumber(tenantId),
      title: dto.title,
      items,
      invitedSupplierIds: dto.invitedSupplierIds ?? [],
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      createdBy,
      note: dto.note,
    });

    return this.rfqRepo.save(rfq);
  }

  async findAll(tenantId: string, opts?: {
    page?: number;
    limit?: number;
    status?: RfqStatus;
  }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.rfqRepo
      .createQueryBuilder('rfq')
      .leftJoinAndSelect('rfq.items', 'items')
      .where('rfq.tenantId = :tenantId', { tenantId })
      .orderBy('rfq.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.status) {
      qb.andWhere('rfq.status = :status', { status: opts.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(tenantId: string, id: string): Promise<RfqRequest> {
    const rfq = await this.rfqRepo.findOne({
      where: { id, tenantId },
      relations: ['items', 'quotations'],
    });
    if (!rfq) throw new NotFoundException('詢價單不存在');
    return rfq;
  }

  /** 發送詢價 */
  async send(tenantId: string, id: string): Promise<RfqRequest> {
    const rfq = await this.findById(tenantId, id);
    if (rfq.status !== RfqStatus.DRAFT) {
      throw new BadRequestException('只有草稿狀態可以發送');
    }
    rfq.status = RfqStatus.SENT;
    return this.rfqRepo.save(rfq);
  }

  /** 供應商提交報價 */
  async submitQuotation(tenantId: string, rfqId: string, dto: SubmitQuotationDto): Promise<RfqQuotation> {
    const rfq = await this.findById(tenantId, rfqId);
    if (![RfqStatus.SENT, RfqStatus.QUOTED].includes(rfq.status)) {
      throw new BadRequestException('詢價單目前不接受報價');
    }

    const quotation = this.quotationRepo.create({
      rfqRequestId: rfqId,
      supplierId: dto.supplierId,
      supplierName: dto.supplierName,
      lineItems: dto.lineItems,
      totalAmount: dto.totalAmount,
      leadTimeDays: dto.leadTimeDays,
      paymentTerms: dto.paymentTerms,
      note: dto.note,
    });

    await this.quotationRepo.save(quotation);

    // 更新 RFQ 狀態為已報價
    if (rfq.status === RfqStatus.SENT) {
      rfq.status = RfqStatus.QUOTED;
      await this.rfqRepo.save(rfq);
    }

    return quotation;
  }

  /** 比價結果 — 取得所有報價並排序 */
  async compareQuotations(tenantId: string, rfqId: string): Promise<RfqQuotation[]> {
    await this.findById(tenantId, rfqId);
    return this.quotationRepo.find({
      where: { rfqRequestId: rfqId },
      order: { totalAmount: 'ASC' },
    });
  }

  /** 決標 */
  async award(tenantId: string, rfqId: string, supplierId: string): Promise<RfqRequest> {
    const rfq = await this.findById(tenantId, rfqId);
    if (rfq.status !== RfqStatus.QUOTED) {
      throw new BadRequestException('只有已報價狀態可以決標');
    }

    // 標記得標供應商
    rfq.awardedSupplierId = supplierId;
    rfq.status = RfqStatus.CLOSED;

    await this.quotationRepo
      .createQueryBuilder()
      .update()
      .set({ isAwarded: false })
      .where('rfqRequestId = :rfqId', { rfqId })
      .execute();

    await this.quotationRepo
      .createQueryBuilder()
      .update()
      .set({ isAwarded: true })
      .where('rfqRequestId = :rfqId AND supplierId = :supplierId', { rfqId, supplierId })
      .execute();

    return this.rfqRepo.save(rfq);
  }

  // ── 內部方法 ──

  private async generateRfqNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `RFQ-${ym}`;
    const count = await this.rfqRepo
      .createQueryBuilder('rfq')
      .where('rfq.tenantId = :tenantId', { tenantId })
      .andWhere('rfq.rfqNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
