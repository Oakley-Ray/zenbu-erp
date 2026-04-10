import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Inventory } from './inventory.entity';
import { StockMovement } from './stock-movement.entity';
import { StockMovementType } from '@layerframe/shared-types';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    private readonly dataSource: DataSource,
  ) {}

  /** 取得某產品的庫存 */
  async getStock(tenantId: string, productId: string, warehouse = 'main'): Promise<Inventory> {
    const inv = await this.inventoryRepo.findOne({
      where: { tenantId, productId, warehouse },
    });
    if (!inv) throw new NotFoundException('找不到庫存記錄');
    return inv;
  }

  /** 列出租戶所有庫存（含低庫存警告） */
  async findAll(tenantId: string, opts?: { warehouse?: string; lowStockOnly?: boolean }) {
    const qb = this.inventoryRepo
      .createQueryBuilder('inv')
      .where('inv.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('inv.product', 'product');

    if (opts?.warehouse) {
      qb.andWhere('inv.warehouse = :warehouse', { warehouse: opts.warehouse });
    }
    if (opts?.lowStockOnly) {
      qb.andWhere('inv.quantity <= inv.safetyStock');
    }

    return qb.orderBy('inv.updatedAt', 'DESC').getMany();
  }

  /** 進貨 / 增加庫存 */
  async stockIn(
    tenantId: string,
    productId: string,
    quantity: number,
    opts?: { warehouse?: string; note?: string; referenceId?: string; referenceType?: string; operatorId?: string },
  ): Promise<Inventory> {
    if (quantity <= 0) throw new BadRequestException('進貨數量必須大於 0');
    return this.adjustStock(tenantId, productId, quantity, StockMovementType.IN, opts);
  }

  /** 出貨 / 減少庫存 */
  async stockOut(
    tenantId: string,
    productId: string,
    quantity: number,
    opts?: { warehouse?: string; note?: string; referenceId?: string; referenceType?: string; operatorId?: string },
  ): Promise<Inventory> {
    if (quantity <= 0) throw new BadRequestException('出貨數量必須大於 0');
    return this.adjustStock(tenantId, productId, -quantity, StockMovementType.OUT, opts);
  }

  /** 預留庫存（訂單成立時） */
  async reserve(tenantId: string, productId: string, quantity: number, warehouse = 'main'): Promise<void> {
    const inv = await this.getOrCreate(tenantId, productId, warehouse);
    if (inv.quantity - inv.reserved < quantity) {
      throw new BadRequestException(`庫存不足，可用: ${inv.quantity - inv.reserved}，需求: ${quantity}`);
    }
    inv.reserved += quantity;
    await this.inventoryRepo.save(inv);
  }

  /** 釋放預留（訂單取消時） */
  async release(tenantId: string, productId: string, quantity: number, warehouse = 'main'): Promise<void> {
    const inv = await this.getStock(tenantId, productId, warehouse);
    inv.reserved = Math.max(0, inv.reserved - quantity);
    await this.inventoryRepo.save(inv);
  }

  /** 確認出貨（預留 → 實際扣除） */
  async confirmShipment(
    tenantId: string,
    productId: string,
    quantity: number,
    opts?: { warehouse?: string; referenceId?: string; operatorId?: string },
  ): Promise<Inventory> {
    const warehouse = opts?.warehouse ?? 'main';
    const inv = await this.getStock(tenantId, productId, warehouse);

    inv.reserved = Math.max(0, inv.reserved - quantity);
    inv.quantity -= quantity;

    if (inv.quantity < 0) throw new BadRequestException('庫存不足，無法出貨');

    await this.inventoryRepo.save(inv);

    // 記錄異動
    await this.movementRepo.save(
      this.movementRepo.create({
        tenantId,
        productId,
        type: StockMovementType.OUT,
        quantity: -quantity,
        warehouse,
        referenceId: opts?.referenceId,
        referenceType: 'order_shipment',
        operatorId: opts?.operatorId,
      }),
    );

    return inv;
  }

  /** 取得異動記錄 */
  async getMovements(tenantId: string, productId?: string, limit = 50) {
    const qb = this.movementRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId })
      .orderBy('m.createdAt', 'DESC')
      .take(limit);

    if (productId) {
      qb.andWhere('m.productId = :productId', { productId });
    }

    return qb.getMany();
  }

  /** 設定安全庫存量 */
  async setSafetyStock(tenantId: string, productId: string, safetyStock: number, warehouse = 'main'): Promise<Inventory> {
    const inv = await this.getOrCreate(tenantId, productId, warehouse);
    inv.safetyStock = safetyStock;
    return this.inventoryRepo.save(inv);
  }

  // ── 內部方法 ──

  private async adjustStock(
    tenantId: string,
    productId: string,
    quantity: number,
    type: StockMovementType,
    opts?: { warehouse?: string; note?: string; referenceId?: string; referenceType?: string; operatorId?: string },
  ): Promise<Inventory> {
    const warehouse = opts?.warehouse ?? 'main';

    // 用 transaction 確保庫存和異動記錄的一致性
    return this.dataSource.transaction(async (manager) => {
      const inv = await this.getOrCreate(tenantId, productId, warehouse);
      inv.quantity += quantity;

      if (inv.quantity < 0) throw new BadRequestException('庫存不足');

      await manager.save(inv);

      await manager.save(
        this.movementRepo.create({
          tenantId,
          productId,
          type,
          quantity,
          warehouse,
          note: opts?.note,
          referenceId: opts?.referenceId,
          referenceType: opts?.referenceType,
          operatorId: opts?.operatorId,
        }),
      );

      return inv;
    });
  }

  private async getOrCreate(tenantId: string, productId: string, warehouse: string): Promise<Inventory> {
    let inv = await this.inventoryRepo.findOne({
      where: { tenantId, productId, warehouse },
    });
    if (!inv) {
      inv = this.inventoryRepo.create({ tenantId, productId, warehouse, quantity: 0 });
      inv = await this.inventoryRepo.save(inv);
    }
    return inv;
  }
}
