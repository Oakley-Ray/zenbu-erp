import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity';
import { GoodsReceiptService } from './goods-receipt.service';
import { GoodsReceiptController } from './goods-receipt.controller';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { InventoryModule } from '../../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GoodsReceipt, GoodsReceiptItem]),
    PurchaseOrdersModule,
    SuppliersModule,
    InventoryModule,
  ],
  controllers: [GoodsReceiptController],
  providers: [GoodsReceiptService],
  exports: [GoodsReceiptService],
})
export class GoodsReceiptModule {}
