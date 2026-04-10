import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity';
import { CreateGrDto } from './dto/create-gr.dto';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { InventoryService } from '../../inventory/inventory.service';
import {
  GoodsReceiptStatus,
  InspectionResult,
  InspectionType,
  PurchaseOrderStatus,
} from '@layerframe/shared-types';

@Injectable()
export class GoodsReceiptService {
  constructor(
    @InjectRepository(GoodsReceipt)
    private readonly grRepo: Repository<GoodsReceipt>,
    @InjectRepository(GoodsReceiptItem)
    private readonly grItemRepo: Repository<GoodsReceiptItem>,
    private readonly poService: PurchaseOrdersService,
    private readonly suppliersService: SuppliersService,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  /** 建立收貨單（關聯 PO） */
  async create(tenantId: string, dto: CreateGrDto, receivedBy?: string): Promise<GoodsReceipt> {
    const po = await this.poService.findById(tenantId, dto.purchaseOrderId);

    // PO 必須是 ORDERED 或 PARTIAL_RECEIVED
    if (
      ![PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.PARTIAL_RECEIVED].includes(po.status)
    ) {
      throw new BadRequestException(`PO 狀態 ${po.status} 不允許收貨`);
    }

    const tolerance = dto.overReceiveTolerance ?? 5;

    // 驗證每個品項的收貨數量
    for (const itemDto of dto.items) {
      const poItem = po.items.find((i) => i.id === itemDto.poItemId);
      if (!poItem) throw new BadRequestException(`PO 明細 ${itemDto.poItemId} 不存在`);

      const remaining = poItem.orderedQty - poItem.receivedQty;
      const maxReceive = Math.ceil(remaining * (1 + tolerance / 100));
      if (itemDto.receivedQty > maxReceive) {
        throw new BadRequestException(
          `品項 ${poItem.productName} 超出溢收容許（可收 ${maxReceive}，實收 ${itemDto.receivedQty}）`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const items = dto.items.map((itemDto) => {
        const accepted = itemDto.acceptedQty ?? itemDto.receivedQty;
        const rejected = itemDto.rejectedQty ?? 0;
        return this.grItemRepo.create({
          poItemId: itemDto.poItemId,
          productId: itemDto.productId,
          productName: itemDto.productName,
          sku: itemDto.sku,
          orderedQty: itemDto.orderedQty,
          receivedQty: itemDto.receivedQty,
          acceptedQty: accepted,
          rejectedQty: rejected,
          inspectionType: itemDto.inspectionType ?? InspectionType.SAMPLING,
          inspectionResult: itemDto.inspectionResult,
          inspectionDetails: itemDto.inspectionDetails,
          disposition: itemDto.disposition,
          note: itemDto.note,
        });
      });

      const gr = this.grRepo.create({
        tenantId,
        grNumber: await this.generateGrNumber(tenantId),
        purchaseOrderId: dto.purchaseOrderId,
        items,
        status: GoodsReceiptStatus.DRAFT,
        receivedBy,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(),
        overReceiveTolerance: tolerance,
        note: dto.note,
      });

      return manager.save(gr);
    });
  }

  /** 完成收貨（品檢完成後確認） */
  async complete(tenantId: string, grId: string): Promise<GoodsReceipt> {
    const gr = await this.findById(tenantId, grId);

    if (gr.status === GoodsReceiptStatus.COMPLETED) {
      throw new BadRequestException('收貨單已完成');
    }

    const po = await this.poService.findById(tenantId, gr.purchaseOrderId);

    return this.dataSource.transaction(async () => {
      // 逐品項處理
      for (const item of gr.items) {
        // 更新 PO 明細的已到貨數量
        await this.poService.updateReceivedQty(tenantId, item.poItemId, item.receivedQty);

        // 合格品入庫
        if (item.acceptedQty > 0 && item.productId) {
          await this.inventoryService.stockIn(tenantId, item.productId, item.acceptedQty, {
            referenceId: gr.id,
            referenceType: 'goods_receipt',
            note: `收貨入庫 - ${gr.grNumber}`,
          });
        }
      }

      // 更新收貨單狀態
      gr.status = GoodsReceiptStatus.COMPLETED;
      await this.grRepo.save(gr);

      // 更新 PO 到貨狀態
      await this.poService.refreshReceiptStatus(tenantId, po.id);

      // 更新供應商品質評分
      await this.updateSupplierScores(tenantId, po.supplierId, gr);

      return gr;
    });
  }

  async findAll(tenantId: string, opts?: {
    page?: number;
    limit?: number;
    purchaseOrderId?: string;
    status?: GoodsReceiptStatus;
  }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.grRepo
      .createQueryBuilder('gr')
      .leftJoinAndSelect('gr.items', 'items')
      .leftJoinAndSelect('gr.purchaseOrder', 'po')
      .where('gr.tenantId = :tenantId', { tenantId })
      .orderBy('gr.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.purchaseOrderId) {
      qb.andWhere('gr.purchaseOrderId = :poId', { poId: opts.purchaseOrderId });
    }
    if (opts?.status) {
      qb.andWhere('gr.status = :status', { status: opts.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(tenantId: string, id: string): Promise<GoodsReceipt> {
    const gr = await this.grRepo.findOne({
      where: { id, tenantId },
      relations: ['items', 'purchaseOrder'],
    });
    if (!gr) throw new NotFoundException('收貨單不存在');
    return gr;
  }

  /** 更新品檢結果 */
  async updateInspection(
    tenantId: string,
    grId: string,
    itemId: string,
    data: {
      inspectionResult: InspectionResult;
      acceptedQty: number;
      rejectedQty: number;
      disposition?: string;
      inspectionDetails?: GoodsReceiptItem['inspectionDetails'];
      specialAcceptApprovedBy?: string;
    },
  ): Promise<GoodsReceiptItem> {
    await this.findById(tenantId, grId);

    const item = await this.grItemRepo.findOne({ where: { id: itemId, goodsReceiptId: grId } });
    if (!item) throw new NotFoundException('收貨明細不存在');

    Object.assign(item, data);
    return this.grItemRepo.save(item);
  }

  // ── 內部方法 ──

  /** 更新供應商評分 */
  private async updateSupplierScores(
    tenantId: string,
    supplierId: string,
    gr: GoodsReceipt,
  ): Promise<void> {
    const totalReceived = gr.items.reduce((s, i) => s + i.receivedQty, 0);
    const totalAccepted = gr.items.reduce((s, i) => s + i.acceptedQty, 0);

    if (totalReceived > 0) {
      const qualityRate = (totalAccepted / totalReceived) * 100;
      // 使用滑動平均更新（新分數佔 30%，歷史佔 70%）
      const supplier = await this.suppliersService.findById(tenantId, supplierId);
      const newQualityScore = Number(supplier.qualityScore) * 0.7 + qualityRate * 0.3;
      await this.suppliersService.updateScores(tenantId, supplierId, {
        qualityScore: Math.round(newQualityScore * 100) / 100,
      });
    }
  }

  private async generateGrNumber(tenantId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `GR-${today}`;
    const count = await this.grRepo
      .createQueryBuilder('gr')
      .where('gr.tenantId = :tenantId', { tenantId })
      .andWhere('gr.grNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
