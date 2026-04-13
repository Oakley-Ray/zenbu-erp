import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentItem } from './entities/shipment-item.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentStatus } from '@layerframe/shared-types';

const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.PENDING]: [ShipmentStatus.PICKED, ShipmentStatus.SHIPPED],
  [ShipmentStatus.PICKED]: [ShipmentStatus.PACKED],
  [ShipmentStatus.PACKED]: [ShipmentStatus.SHIPPED],
  [ShipmentStatus.SHIPPED]: [ShipmentStatus.IN_TRANSIT],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.DELIVERED],
  [ShipmentStatus.DELIVERED]: [],
};

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentItem)
    private readonly itemRepo: Repository<ShipmentItem>,
  ) {}

  async create(tenantId: string, dto: CreateShipmentDto, createdBy?: string): Promise<Shipment> {
    const items = dto.items.map((i) =>
      this.itemRepo.create({
        orderItemId: i.orderItemId,
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        quantity: i.quantity,
      }),
    );

    const shipment = this.shipmentRepo.create({
      tenantId,
      shipmentNumber: await this.generateNumber(tenantId),
      orderId: dto.orderId,
      items,
      recipientName: dto.recipientName,
      recipientPhone: dto.recipientPhone,
      recipientAddress: dto.recipientAddress,
      carrier: dto.carrier,
      shippingMethod: dto.shippingMethod ?? 'delivery',
      trackingNumber: dto.trackingNumber,
      trackingUrl: dto.trackingUrl,
      estimatedShipDate: dto.estimatedShipDate ? new Date(dto.estimatedShipDate) : undefined,
      note: dto.note,
      createdBy,
    });

    return this.shipmentRepo.save(shipment);
  }

  async findByOrder(tenantId: string, orderId: string): Promise<Shipment[]> {
    return this.shipmentRepo.find({
      where: { tenantId, orderId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(tenantId: string, id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });
    if (!shipment) throw new NotFoundException('出貨單不存在');
    return shipment;
  }

  async updateStatus(tenantId: string, id: string, newStatus: ShipmentStatus): Promise<Shipment> {
    const shipment = await this.findById(tenantId, id);
    const allowed = SHIPMENT_TRANSITIONS[shipment.status];
    if (!allowed?.includes(newStatus)) {
      throw new BadRequestException(
        `無法從 ${shipment.status} 轉換到 ${newStatus}`,
      );
    }

    shipment.status = newStatus;

    if (newStatus === ShipmentStatus.SHIPPED) {
      shipment.shippedAt = new Date();
    }
    if (newStatus === ShipmentStatus.DELIVERED) {
      shipment.deliveredAt = new Date();
    }

    return this.shipmentRepo.save(shipment);
  }

  async updateTracking(tenantId: string, id: string, trackingNumber: string, trackingUrl?: string): Promise<Shipment> {
    const shipment = await this.findById(tenantId, id);
    shipment.trackingNumber = trackingNumber;
    if (trackingUrl) shipment.trackingUrl = trackingUrl;
    return this.shipmentRepo.save(shipment);
  }

  async findAll(tenantId: string, opts?: {
    page?: number;
    limit?: number;
    status?: ShipmentStatus;
  }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.shipmentRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.items', 'items')
      .leftJoinAndSelect('s.order', 'order')
      .where('s.tenantId = :tenantId', { tenantId })
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.status) {
      qb.andWhere('s.status = :status', { status: opts.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  private async generateNumber(tenantId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `SHP-${today}`;
    const count = await this.shipmentRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.shipmentNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
