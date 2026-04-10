import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { ProcurementModule } from './procurement/procurement.module';

/**
 * ERP 根模組 — 整合產品、庫存、訂單、採購管理。
 */
@Module({
  imports: [ProductsModule, InventoryModule, OrdersModule, ProcurementModule],
  exports: [ProductsModule, InventoryModule, OrdersModule, ProcurementModule],
})
export class ErpModule {}
