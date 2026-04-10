import { Controller, Post, Body, Headers } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { CheckoutService, CheckoutDto } from '../checkout.service';

/** 結帳 API — 公開路由 */
@Controller('store/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Public()
  @Post()
  checkout(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CheckoutDto,
  ) {
    return this.checkoutService.checkout(tenantId, dto);
  }
}
