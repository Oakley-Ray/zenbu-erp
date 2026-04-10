import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreSetting } from './store-setting.entity';
import { Customer } from './customer.entity';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Wishlist } from './wishlist.entity';
import { StoreService } from './store.service';
import { CartService } from './cart.service';
import { CheckoutService } from './checkout.service';
import { CustomerService } from './customer.service';
import { StoreController } from './controllers/store.controller';
import { CartController } from './controllers/cart.controller';
import { CheckoutController } from './controllers/checkout.controller';
import { CustomerController } from './controllers/customer.controller';
import { StoreAdminController } from './controllers/store-admin.controller';
import { ProductsModule } from '../erp/products/products.module';
import { OrdersModule } from '../erp/orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreSetting, Customer, Cart, CartItem, Wishlist]),
    ProductsModule,  // 購物車加入商品時查詢產品
    OrdersModule,    // 結帳時建立訂單
  ],
  controllers: [
    StoreController,
    CartController,
    CheckoutController,
    CustomerController,
    StoreAdminController,
  ],
  providers: [StoreService, CartService, CheckoutService, CustomerService],
  exports: [CustomerService, StoreService],
})
export class EcommerceModule {}
