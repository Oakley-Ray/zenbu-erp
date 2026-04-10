import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CustomerService } from './customer.service';
import { OrdersService } from '../erp/orders/orders.service';
import { OrderStatus } from '@layerframe/shared-types';

export interface CheckoutDto {
  customerId: string;
  sessionId?: string;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  shippingFee?: number;
  discount?: number;
  note?: string;
}

/**
 * 結帳服務 — 購物車 → 訂單的轉換流程。
 *
 * 流程：
 * 1. 驗證購物車不為空
 * 2. 將購物車品項轉成訂單明細
 * 3. 呼叫 OrdersService.create()（內部會預留庫存）
 * 4. 清空購物車
 * 5. 更新顧客統計（消費金額、訂單數）
 */
@Injectable()
export class CheckoutService {
  constructor(
    private readonly cartService: CartService,
    private readonly customerService: CustomerService,
    private readonly ordersService: OrdersService,
  ) {}

  async checkout(tenantId: string, dto: CheckoutDto) {
    // 1. 取得購物車
    const identity = dto.sessionId
      ? { sessionId: dto.sessionId }
      : { customerId: dto.customerId };
    const cart = await this.cartService.getOrCreate(tenantId, identity);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('購物車是空的');
    }

    // 2. 取得顧客
    const customer = await this.customerService.findById(tenantId, dto.customerId);

    // 3. 轉成訂單
    const order = await this.ordersService.create(tenantId, {
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      shippingFee: dto.shippingFee,
      discount: dto.discount,
      shippingAddress: dto.shippingAddress,
      note: dto.note,
    });

    // 4. 清空購物車
    await this.cartService.clear(tenantId, identity);

    // 5. 更新顧客統計
    await this.customerService.addOrderStats(
      tenantId,
      customer.id,
      Number(order.totalAmount),
    );

    return {
      order,
      message: '結帳成功，請前往付款',
    };
  }
}
