import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PoAmendment } from './entities/po-amendment.entity';
import { CreatePoDto } from './dto/create-po.dto';
import { SuppliersService } from '../suppliers/suppliers.service';
import { PurchaseOrderStatus, ApprovalLevel } from '@layerframe/shared-types';

/** PO 狀態機 */
const PO_STATE_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  [PurchaseOrderStatus.DRAFT]: [PurchaseOrderStatus.PENDING_APPROVAL, PurchaseOrderStatus.CANCELLED],
  [PurchaseOrderStatus.PENDING_APPROVAL]: [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.REJECTED],
  [PurchaseOrderStatus.APPROVED]: [PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.CANCELLED],
  [PurchaseOrderStatus.REJECTED]: [PurchaseOrderStatus.DRAFT],
  [PurchaseOrderStatus.ORDERED]: [PurchaseOrderStatus.PARTIAL_RECEIVED, PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED],
  [PurchaseOrderStatus.PARTIAL_RECEIVED]: [PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CLOSED],
  [PurchaseOrderStatus.RECEIVED]: [PurchaseOrderStatus.CLOSED],
  [PurchaseOrderStatus.CLOSED]: [],
  [PurchaseOrderStatus.CANCELLED]: [],
};

/** 審核門檻 */
const APPROVAL_THRESHOLDS = [
  { level: ApprovalLevel.MANAGER, max: 50000 },
  { level: ApprovalLevel.DIRECTOR, max: 200000 },
  { level: ApprovalLevel.VP, max: Infinity },
];

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(PoAmendment)
    private readonly amendmentRepo: Repository<PoAmendment>,
    private readonly suppliersService: SuppliersService,
    private readonly dataSource: DataSource,
  ) {}

  /** 建立採購單 */
  async create(tenantId: string, dto: CreatePoDto, createdBy?: string): Promise<PurchaseOrder> {
    // 驗證供應商
    await this.suppliersService.findById(tenantId, dto.supplierId);

    const items: PurchaseOrderItem[] = dto.items.map((itemDto) => {
      const subtotal = itemDto.unitPrice * itemDto.orderedQty;
      return this.poItemRepo.create({
        productId: itemDto.productId,
        productName: itemDto.productName,
        sku: itemDto.sku,
        specification: itemDto.specification,
        unitPrice: itemDto.unitPrice,
        orderedQty: itemDto.orderedQty,
        unit: itemDto.unit ?? 'pcs',
        subtotal,
      });
    });

    const subtotal = items.reduce((sum, i) => sum + Number(i.subtotal), 0);
    const tax = dto.tax ?? 0;
    const totalAmount = subtotal + tax;

    // 依金額決定審核層級
    const approvalLevel = this.determineApprovalLevel(totalAmount);

    const po = this.poRepo.create({
      tenantId,
      poNumber: await this.generatePoNumber(tenantId),
      supplierId: dto.supplierId,
      items,
      subtotal,
      tax,
      totalAmount,
      approvalLevel,
      expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
      deliveryAlertDays: dto.deliveryAlertDays,
      paymentTerms: dto.paymentTerms,
      note: dto.note,
      createdBy,
    });

    return this.poRepo.save(po);
  }

  /** 列表查詢 */
  async findAll(tenantId: string, opts?: {
    page?: number;
    limit?: number;
    status?: PurchaseOrderStatus;
    supplierId?: string;
  }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.poRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .where('po.tenantId = :tenantId', { tenantId })
      .orderBy('po.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.status) {
      qb.andWhere('po.status = :status', { status: opts.status });
    }
    if (opts?.supplierId) {
      qb.andWhere('po.supplierId = :supplierId', { supplierId: opts.supplierId });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(tenantId: string, id: string): Promise<PurchaseOrder> {
    const po = await this.poRepo.findOne({
      where: { id, tenantId },
      relations: ['items', 'supplier'],
    });
    if (!po) throw new NotFoundException('採購單不存在');
    return po;
  }

  /** 送審 */
  async submitForApproval(tenantId: string, id: string): Promise<PurchaseOrder> {
    return this.transitionStatus(tenantId, id, PurchaseOrderStatus.PENDING_APPROVAL);
  }

  /** 審核通過 */
  async approve(tenantId: string, id: string, approvedBy: string, note?: string): Promise<PurchaseOrder> {
    const po = await this.findById(tenantId, id);
    this.validateTransition(po.status, PurchaseOrderStatus.APPROVED);
    po.status = PurchaseOrderStatus.APPROVED;
    po.approvedBy = approvedBy;
    po.approvedAt = new Date();
    po.approvalNote = note;
    return this.poRepo.save(po);
  }

  /** 審核退回 */
  async reject(tenantId: string, id: string, approvedBy: string, note: string): Promise<PurchaseOrder> {
    const po = await this.findById(tenantId, id);
    this.validateTransition(po.status, PurchaseOrderStatus.REJECTED);
    po.status = PurchaseOrderStatus.REJECTED;
    po.approvedBy = approvedBy;
    po.approvedAt = new Date();
    po.approvalNote = note;
    return this.poRepo.save(po);
  }

  /** 更新狀態 */
  async updateStatus(tenantId: string, id: string, newStatus: PurchaseOrderStatus): Promise<PurchaseOrder> {
    return this.transitionStatus(tenantId, id, newStatus);
  }

  /** PO 變更（amendment） */
  async amend(
    tenantId: string,
    id: string,
    updates: Partial<CreatePoDto>,
    changedBy: string,
    changeDescription: string,
  ): Promise<PurchaseOrder> {
    const po = await this.findById(tenantId, id);

    // 只有 DRAFT 或 APPROVED 或 ORDERED 可以變更
    if (![PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.ORDERED].includes(po.status)) {
      throw new BadRequestException(`狀態 ${po.status} 不允許變更`);
    }

    // 保存變更前快照
    const snapshot = {
      version: po.version,
      items: po.items,
      subtotal: po.subtotal,
      tax: po.tax,
      totalAmount: po.totalAmount,
      expectedDeliveryDate: po.expectedDeliveryDate,
      note: po.note,
    };

    await this.amendmentRepo.save(
      this.amendmentRepo.create({
        tenantId,
        purchaseOrderId: id,
        fromVersion: po.version,
        toVersion: po.version + 1,
        previousSnapshot: snapshot,
        changeDescription,
        changedBy,
      }),
    );

    // 更新 PO
    if (updates.items) {
      // 刪除舊品項，建立新品項
      await this.poItemRepo.delete({ purchaseOrderId: id });
      po.items = updates.items.map((itemDto) => {
        const subtotal = itemDto.unitPrice * itemDto.orderedQty;
        return this.poItemRepo.create({
          purchaseOrderId: id,
          productId: itemDto.productId,
          productName: itemDto.productName,
          sku: itemDto.sku,
          specification: itemDto.specification,
          unitPrice: itemDto.unitPrice,
          orderedQty: itemDto.orderedQty,
          unit: itemDto.unit ?? 'pcs',
          subtotal,
        });
      });
      po.subtotal = po.items.reduce((sum, i) => sum + Number(i.subtotal), 0);
      po.tax = updates.tax ?? po.tax;
      po.totalAmount = po.subtotal + Number(po.tax);
      po.approvalLevel = this.determineApprovalLevel(po.totalAmount);
    }

    if (updates.expectedDeliveryDate) {
      po.expectedDeliveryDate = new Date(updates.expectedDeliveryDate);
    }
    if (updates.note !== undefined) po.note = updates.note;

    po.version += 1;

    // 變更後如果非 DRAFT 則回到待審
    if (po.status !== PurchaseOrderStatus.DRAFT) {
      po.status = PurchaseOrderStatus.PENDING_APPROVAL;
      po.approvedBy = undefined;
      po.approvedAt = undefined;
    }

    return this.poRepo.save(po);
  }

  /** 取得 PO 的變更歷程 */
  async getAmendments(tenantId: string, purchaseOrderId: string): Promise<PoAmendment[]> {
    return this.amendmentRepo.find({
      where: { tenantId, purchaseOrderId },
      order: { createdAt: 'DESC' },
    });
  }

  /** 更新已到貨數量（由收貨模組呼叫） */
  async updateReceivedQty(
    tenantId: string,
    poItemId: string,
    receivedQty: number,
  ): Promise<void> {
    const item = await this.poItemRepo.findOne({ where: { id: poItemId } });
    if (!item) throw new NotFoundException('PO 明細不存在');
    item.receivedQty = (item.receivedQty ?? 0) + receivedQty;
    await this.poItemRepo.save(item);
  }

  /** 檢查並更新 PO 到貨狀態 */
  async refreshReceiptStatus(tenantId: string, poId: string): Promise<PurchaseOrder> {
    const po = await this.findById(tenantId, poId);
    const allReceived = po.items.every((i) => i.receivedQty >= i.orderedQty);
    const anyReceived = po.items.some((i) => i.receivedQty > 0);

    if (allReceived) {
      po.status = PurchaseOrderStatus.RECEIVED;
    } else if (anyReceived && po.status === PurchaseOrderStatus.ORDERED) {
      po.status = PurchaseOrderStatus.PARTIAL_RECEIVED;
    }

    return this.poRepo.save(po);
  }

  /** 取得逾期未交的 PO */
  async getOverduePOs(tenantId: string): Promise<PurchaseOrder[]> {
    const now = new Date();
    return this.poRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .where('po.tenantId = :tenantId', { tenantId })
      .andWhere('po.status IN (:...statuses)', {
        statuses: [PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.PARTIAL_RECEIVED],
      })
      .andWhere('po.expectedDeliveryDate < :now', { now })
      .orderBy('po.expectedDeliveryDate', 'ASC')
      .getMany();
  }

  /** 取得即將到期（N 天內）的 PO */
  async getUpcomingDeliveries(tenantId: string, days: number = 7): Promise<PurchaseOrder[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.poRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .where('po.tenantId = :tenantId', { tenantId })
      .andWhere('po.status IN (:...statuses)', {
        statuses: [PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.PARTIAL_RECEIVED],
      })
      .andWhere('po.expectedDeliveryDate BETWEEN :now AND :future', { now, future })
      .orderBy('po.expectedDeliveryDate', 'ASC')
      .getMany();
  }

  // ── 內部方法 ──

  private validateTransition(current: PurchaseOrderStatus, target: PurchaseOrderStatus) {
    const allowed = PO_STATE_TRANSITIONS[current];
    if (!allowed?.includes(target)) {
      throw new BadRequestException(
        `無法從 ${current} 轉換到 ${target}。合法的下一步：${allowed?.join(', ') || '無'}`,
      );
    }
  }

  private async transitionStatus(
    tenantId: string,
    id: string,
    newStatus: PurchaseOrderStatus,
  ): Promise<PurchaseOrder> {
    const po = await this.findById(tenantId, id);
    this.validateTransition(po.status, newStatus);
    po.status = newStatus;
    return this.poRepo.save(po);
  }

  private determineApprovalLevel(totalAmount: number): ApprovalLevel {
    for (const threshold of APPROVAL_THRESHOLDS) {
      if (totalAmount <= threshold.max) return threshold.level;
    }
    return ApprovalLevel.VP;
  }

  /** 產生 PO 編號：PO-YYYYMM-NNN */
  private async generatePoNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `PO-${ym}`;

    const count = await this.poRepo
      .createQueryBuilder('po')
      .where('po.tenantId = :tenantId', { tenantId })
      .andWhere('po.poNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();

    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
