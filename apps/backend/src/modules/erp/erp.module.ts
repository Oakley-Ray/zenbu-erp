import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { ProcurementModule } from './procurement/procurement.module';
import { ProjectModule } from './project/project.module';

/**
 * ERP 根模組 — 整合產品、庫存、訂單、採購、專案管理。
 */
@Module({
  imports: [ProductsModule, InventoryModule, OrdersModule, ProcurementModule, ProjectModule],
  exports: [ProductsModule, InventoryModule, OrdersModule, ProcurementModule, ProjectModule],
})
export class ErpModule {}
