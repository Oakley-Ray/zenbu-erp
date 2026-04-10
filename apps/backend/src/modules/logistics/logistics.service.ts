import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrier, PricingModel, CarrierZone } from './carrier.entity';
import { Quote } from './quote.entity';
import { QuoteItem } from './quote-item.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateCarrierDto, UpdateCarrierDto } from './dto/carrier.dto';
import { QuoteStatus } from '@layerframe/shared-types';
import { calculateVolumetricWeight } from '@layerframe/shared-utils';

/** 比價結果 — 每個物流商的報價明細 */
export interface CarrierQuote {
  carrierId: string;
  carrierName: string;
  carrierCode: string;
  zone: CarrierZone;
  chargeableWeightKg: number;
  shippingFee: number;
  currency: string;
  estimatedDays?: { min: number; max: number };
}

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(Carrier)
    private readonly carrierRepo: Repository<Carrier>,
    @InjectRepository(Quote)
    private readonly quoteRepo: Repository<Quote>,
    @InjectRepository(QuoteItem)
    private readonly quoteItemRepo: Repository<QuoteItem>,
  ) {}

  // ══════════════════════════════════
  // Carriers 物流商管理
  // ══════════════════════════════════

  async createCarrier(tenantId: string, dto: CreateCarrierDto): Promise<Carrier> {
    const exists = await this.carrierRepo.findOne({ where: { tenantId, code: dto.code } });
    if (exists) throw new ConflictException(`物流商代碼 ${dto.code} 已存在`);

    return this.carrierRepo.save(this.carrierRepo.create({ ...dto, tenantId }));
  }

  async findAllCarriers(tenantId: string): Promise<Carrier[]> {
    return this.carrierRepo.find({ where: { tenantId, isActive: true }, order: { name: 'ASC' } });
  }

  async findCarrierById(tenantId: string, id: string): Promise<Carrier> {
    const carrier = await this.carrierRepo.findOne({ where: { id, tenantId } });
    if (!carrier) throw new NotFoundException('物流商不存在');
    return carrier;
  }

  async updateCarrier(tenantId: string, id: string, dto: UpdateCarrierDto): Promise<Carrier> {
    const carrier = await this.findCarrierById(tenantId, id);
    Object.assign(carrier, dto);
    return this.carrierRepo.save(carrier);
  }

  // ══════════════════════════════════
  // Quotes 報價單
  // ════════════════════���═════════════

  /** 建立報價單 — 自動計算材積重並向所有物流商比價 */
  async createQuote(tenantId: string, dto: CreateQuoteDto, operatorId?: string): Promise<{
    quote: Quote;
    comparisons: CarrierQuote[];
  }> {
    // 1. 計算每個品項的材積重
    const quoteItems: QuoteItem[] = [];
    let totalChargeableWeight = 0;

    for (const itemDto of dto.items) {
      const weight = calculateVolumetricWeight({
        lengthCm: itemDto.lengthCm,
        widthCm: itemDto.widthCm,
        heightCm: itemDto.heightCm,
        actualWeightKg: itemDto.actualWeightKg,
      });

      const itemChargeable = weight.chargeableWeightKg * itemDto.quantity;
      totalChargeableWeight += itemChargeable;

      quoteItems.push(
        this.quoteItemRepo.create({
          description: itemDto.description,
          productId: itemDto.productId,
          quantity: itemDto.quantity,
          lengthCm: itemDto.lengthCm,
          widthCm: itemDto.widthCm,
          heightCm: itemDto.heightCm,
          actualWeightKg: itemDto.actualWeightKg,
          volumetricWeightKg: weight.volumetricWeightKg,
          chargeableWeightKg: weight.chargeableWeightKg,
        }),
      );
    }

    // 2. 決定運送區域
    const zone = this.resolveZone(dto.destination.country);

    // 3. 向所有支援該區域的物流商比價
    const carriers = await this.carrierRepo.find({
      where: { tenantId, isActive: true },
    });
    const applicableCarriers = carriers.filter((c) => c.zones.includes(zone));
    const comparisons = applicableCarriers.map((carrier) =>
      this.calculateShippingFee(carrier, zone, totalChargeableWeight),
    );

    // 按運費排序（最便宜的在前）
    comparisons.sort((a, b) => a.shippingFee - b.shippingFee);

    // 4. 計算有效期限
    const validDays = dto.validDays ?? 7;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // 5. 建立報價單
    const quote = await this.quoteRepo.save(
      this.quoteRepo.create({
        tenantId,
        quoteNumber: await this.generateQuoteNumber(tenantId),
        orderId: dto.orderId,
        customerId: dto.customerId,
        customerName: dto.customerName,
        items: quoteItems,
        origin: dto.origin,
        destination: dto.destination,
        totalChargeableWeightKg: totalChargeableWeight,
        status: QuoteStatus.DRAFT,
        validUntil,
        note: dto.note,
        createdBy: operatorId,
      }),
    );

    return { quote, comparisons };
  }

  /** 選定物流商 — 更新報價單的運費和狀態 */
  async selectCarrier(tenantId: string, quoteId: string, carrierId: string): Promise<Quote> {
    const quote = await this.findQuoteById(tenantId, quoteId);
    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.SENT) {
      throw new BadRequestException('只有草稿或已送出的報價單可以選定物流商');
    }

    const carrier = await this.findCarrierById(tenantId, carrierId);
    const zone = this.resolveZone(quote.destination.country);
    const result = this.calculateShippingFee(carrier, zone, Number(quote.totalChargeableWeightKg));

    quote.selectedCarrierId = carrierId;
    quote.totalShippingFee = result.shippingFee;
    quote.status = QuoteStatus.ACCEPTED;
    return this.quoteRepo.save(quote);
  }

  async findAllQuotes(tenantId: string, opts?: { page?: number; limit?: number; status?: QuoteStatus }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.quoteRepo
      .createQueryBuilder('q')
      .where('q.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('q.items', 'items')
      .orderBy('q.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.status) {
      qb.andWhere('q.status = :status', { status: opts.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findQuoteById(tenantId: string, id: string): Promise<Quote> {
    const quote = await this.quoteRepo.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });
    if (!quote) throw new NotFoundException('報價單不存在');
    return quote;
  }

  async updateQuoteStatus(tenantId: string, id: string, status: QuoteStatus): Promise<Quote> {
    const quote = await this.findQuoteById(tenantId, id);
    quote.status = status;
    return this.quoteRepo.save(quote);
  }

  /** 重新比價（用新的物流商費率重新計算） */
  async requote(tenantId: string, quoteId: string): Promise<CarrierQuote[]> {
    const quote = await this.findQuoteById(tenantId, quoteId);
    const zone = this.resolveZone(quote.destination.country);

    const carriers = await this.carrierRepo.find({ where: { tenantId, isActive: true } });
    const applicable = carriers.filter((c) => c.zones.includes(zone));

    const comparisons = applicable.map((carrier) =>
      this.calculateShippingFee(carrier, zone, Number(quote.totalChargeableWeightKg)),
    );
    comparisons.sort((a, b) => a.shippingFee - b.shippingFee);

    return comparisons;
  }

  // ══════════════════════════════════
  // 計算引擎
  // ══════════════════════════════════

  /** 根據物流商費率表計算運費 */
  private calculateShippingFee(
    carrier: Carrier,
    zone: CarrierZone,
    chargeableWeightKg: number,
  ): CarrierQuote {
    let fee = 0;
    const rates = carrier.rates;

    switch (carrier.pricingModel) {
      case PricingModel.PER_KG: {
        const ratePerKg = (rates[zone] as number) ?? 0;
        fee = ratePerKg * chargeableWeightKg;
        break;
      }

      case PricingModel.FLAT_RATE: {
        fee = (rates[zone] as number) ?? 0;
        break;
      }

      case PricingModel.TIERED: {
        const tiers = rates[zone] as Array<{ maxKg: number | null; price: number }> | undefined;
        if (tiers && Array.isArray(tiers)) {
          // 找到對應的階梯
          const tier = tiers.find((t) => t.maxKg === null || chargeableWeightKg <= t.maxKg);
          fee = tier?.price ?? (tiers[tiers.length - 1]?.price ?? 0);
        }
        break;
      }
    }

    // 套用最低收費
    fee = Math.max(fee, Number(carrier.minimumCharge));
    // 四捨五入到整數
    fee = Math.round(fee);

    const estimatedDays = carrier.estimatedDays[zone] as { min: number; max: number } | undefined;

    return {
      carrierId: carrier.id,
      carrierName: carrier.name,
      carrierCode: carrier.code,
      zone,
      chargeableWeightKg,
      shippingFee: fee,
      currency: 'TWD',
      estimatedDays,
    };
  }

  /** 根據目的地國家判斷運送區域 */
  private resolveZone(country: string): CarrierZone {
    const normalized = country.toUpperCase().trim();
    const zones: Record<string, CarrierZone> = {
      TW: CarrierZone.DOMESTIC,
      // 亞洲
      JP: CarrierZone.ASIA, KR: CarrierZone.ASIA, CN: CarrierZone.ASIA,
      HK: CarrierZone.ASIA, SG: CarrierZone.ASIA, MY: CarrierZone.ASIA,
      TH: CarrierZone.ASIA, VN: CarrierZone.ASIA, PH: CarrierZone.ASIA,
      ID: CarrierZone.ASIA, IN: CarrierZone.ASIA,
      // 北美
      US: CarrierZone.NORTH_AMERICA, CA: CarrierZone.NORTH_AMERICA, MX: CarrierZone.NORTH_AMERICA,
      // 歐洲
      GB: CarrierZone.EUROPE, DE: CarrierZone.EUROPE, FR: CarrierZone.EUROPE,
      IT: CarrierZone.EUROPE, ES: CarrierZone.EUROPE, NL: CarrierZone.EUROPE,
      // 大洋洲
      AU: CarrierZone.OCEANIA, NZ: CarrierZone.OCEANIA,
    };
    return zones[normalized] ?? CarrierZone.OTHER;
  }

  /** 產生報價單編號：LQ-YYYYMMDD-XXX */
  private async generateQuoteNumber(tenantId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `LQ-${today}`;
    const count = await this.quoteRepo
      .createQueryBuilder('q')
      .where('q.tenantId = :tenantId', { tenantId })
      .andWhere('q.quoteNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
