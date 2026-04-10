import { Module } from '@nestjs/common';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { GoodsReceiptModule } from './goods-receipt/goods-receipt.module';
import { ReturnsModule } from './returns/returns.module';
import { RfqModule } from './rfq/rfq.module';

/**
 * 採購管理根模組
 * 整合供應商、詢價/報價、採購訂單、收貨/品檢、退貨/索賠
 */
@Module({
  imports: [
    SuppliersModule,
    RfqModule,
    PurchaseOrdersModule,
    GoodsReceiptModule,
    ReturnsModule,
  ],
  exports: [
    SuppliersModule,
    RfqModule,
    PurchaseOrdersModule,
    GoodsReceiptModule,
    ReturnsModule,
  ],
})
export class ProcurementModule {}
