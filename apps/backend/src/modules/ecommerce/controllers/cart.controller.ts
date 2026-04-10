import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Headers,
  Query,
} from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { CartService } from '../cart.service';

/**
 * 購物車 API — 公開路由（支援訪客和登入顧客）。
 * 用 customerId 或 sessionId 識別購物車。
 */
@Controller('store/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Public()
  @Get()
  getCart(
    @Headers('x-tenant-id') tenantId: string,
    @Query('customerId') customerId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const cart$ = this.cartService.getOrCreate(tenantId, { customerId, sessionId });
    return cart$.then((cart) => this.cartService.getCartSummary(cart));
  }

  @Public()
  @Post('items')
  addItem(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: { productId: string; quantity: number; customerId?: string; sessionId?: string },
  ) {
    return this.cartService.addItem(
      tenantId,
      { customerId: dto.customerId, sessionId: dto.sessionId },
      dto.productId,
      dto.quantity,
    );
  }

  @Public()
  @Patch('items')
  updateItem(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: { productId: string; quantity: number; customerId?: string; sessionId?: string },
  ) {
    return this.cartService.updateItemQuantity(
      tenantId,
      { customerId: dto.customerId, sessionId: dto.sessionId },
      dto.productId,
      dto.quantity,
    );
  }

  @Public()
  @Delete('items')
  removeItem(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: { productId: string; customerId?: string; sessionId?: string },
  ) {
    return this.cartService.removeItem(
      tenantId,
      { customerId: dto.customerId, sessionId: dto.sessionId },
      dto.productId,
    );
  }

  @Public()
  @Delete()
  clearCart(
    @Headers('x-tenant-id') tenantId: string,
    @Query('customerId') customerId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.cartService.clear(tenantId, { customerId, sessionId });
  }

  /** 登入後合併訪客購物車 */
  @Public()
  @Post('merge')
  mergeCarts(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: { sessionId: string; customerId: string },
  ) {
    return this.cartService.mergeCarts(tenantId, dto.sessionId, dto.customerId);
  }
}
