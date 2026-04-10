import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentTransaction } from './payment-transaction.entity';
import { PaymentConfig } from './payment-config.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { OrdersModule } from '../erp/orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentTransaction, PaymentConfig]),
    OrdersModule, // 付款完成後更新訂單狀態
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
