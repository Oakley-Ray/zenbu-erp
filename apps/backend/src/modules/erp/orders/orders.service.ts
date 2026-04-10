import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderStatus, PaymentStatus } from '@layerframe/shared-types';

/** 訂單狀態機 — 定義合法的狀態轉換 */
const STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  /** 建立訂單 — 在 transaction 中同時預留庫存 */
  async create(tenantId: string, dto: CreateOrderDto, operatorId?: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // 1. 查詢所有產品，取得價格快照
      const items: OrderItem[] = [];
      let subtotal = 0;

      for (const itemDto of dto.items) {
        const product = await this.productsService.findProductById(tenantId, itemDto.productId);

        // 2. 預留庫存
        await this.inventoryService.reserve(tenantId, product.id, itemDto.quantity);

        const itemSubtotal = Number(product.price) * itemDto.quantity;
        subtotal += itemSubtotal;

        items.push(
          this.itemRepo.create({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            unitPrice: Number(product.price),
            quantity: itemDto.quantity,
            subtotal: itemSubtotal,
          }),
        );
      }

      const shippingFee = dto.shippingFee ?? 0;
      const discount = dto.discount ?? 0;
      const totalAmount = subtotal + shippingFee - discount;

      // 3. 建立訂單
      const order = this.orderRepo.create({
        tenantId,
        orderNumber: await this.generateOrderNumber(tenantId),
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        items,
        subtotal,
        shippingFee,
        discount,
        totalAmount,
        status: OrderStatus.PENDING,
        shippingAddress: dto.shippingAddress,
        note: dto.note,
        createdBy: operatorId,
      });

      return manager.save(order);
    });
  }

  /** 列出訂單（含分頁） */
  async findAll(tenantId: string, opts?: { page?: number; limit?: number; status?: OrderStatus }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('o.items', 'items')
      .orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.status) {
      qb.andWhere('o.status = :status', { status: opts.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /** 取得單一訂單 */
  async findById(tenantId: string, id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('訂單不存在');
    return order;
  }

  /** 更新訂單狀態（狀態機驗證） */
  async updateStatus(tenantId: string, id: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.findById(tenantId, id);
    const allowed = STATE_TRANSITIONS[order.status];

    if (!allowed?.includes(newStatus)) {
      throw new BadRequestException(
        `無法從 ${order.status} 轉換到 ${newStatus}。合法的下一步：${allowed?.join(', ') || '無'}`,
      );
    }

    // 取消訂單時釋放庫存
    if (newStatus === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await this.inventoryService.release(tenantId, item.productId, item.quantity);
      }
    }

    // 出貨時扣除庫存
    if (newStatus === OrderStatus.SHIPPED) {
      for (const item of order.items) {
        await this.inventoryService.confirmShipment(tenantId, item.productId, item.quantity, {
          referenceId: order.id,
        });
      }
    }

    order.status = newStatus;
    return this.orderRepo.save(order);
  }

  /** 更新付款狀態 */
  async updatePaymentStatus(tenantId: string, id: string, paymentStatus: PaymentStatus): Promise<Order> {
    const order = await this.findById(tenantId, id);
    order.paymentStatus = paymentStatus;

    // 付款成功自動確認訂單
    if (paymentStatus === PaymentStatus.SUCCESS && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.CONFIRMED;
    }

    return this.orderRepo.save(order);
  }

  // ── 內部方法 ──

  /** 產生訂單編號：ORD-YYYYMMDD-XXX */
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD-${today}`;

    const count = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.orderNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();

    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
