import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, PaymentProvider } from '@layerframe/shared-types';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ── 付款流程 ──

  /** 建立付款（前端呼叫，取得付款 form 或 redirect URL） */
  @Post('create')
  createPayment(
    @Request() req: { user: JwtPayload },
    @Body() dto: {
      orderId: string;
      provider: PaymentProvider;
      returnUrl: string;
      notifyUrl: string;
    },
  ) {
    return this.paymentService.createPayment(
      req.user.tenantId,
      dto.orderId,
      dto.provider,
      dto.returnUrl,
      dto.notifyUrl,
    );
  }

  /**
   * ECPay 回呼（webhook） — ECPay 付款完成後 POST 到此端點。
   * 公開路由（ECPay 伺服器呼叫，沒有 JWT）。
   */
  @Public()
  @Post('webhook/ecpay')
  @HttpCode(HttpStatus.OK)
  async ecpayCallback(
    @Headers('x-tenant-id') tenantId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const result = await this.paymentService.handleCallback(tenantId, PaymentProvider.ECPAY, payload);
    // ECPay 要求回傳 "1|OK" 表示接收成功
    return result.success ? '1|OK' : '0|FAIL';
  }

  /**
   * Shopline Payment 回呼（webhook）。
   * 公開路由（Shopline 伺服器呼叫，沒有 JWT）。
   */
  @Public()
  @Post('webhook/shopline')
  @HttpCode(HttpStatus.OK)
  async shoplineCallback(
    @Headers('x-tenant-id') tenantId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const result = await this.paymentService.handleCallback(tenantId, PaymentProvider.SHOPLINE, payload);
    return { status: result.success ? 'OK' : 'FAIL' };
  }

  /**
   * 統一金回呼（webhook）。
   * 公開路由（統一金伺服器呼叫，沒有 JWT）。
   */
  @Public()
  @Post('webhook/unipay')
  @HttpCode(HttpStatus.OK)
  async unipayCallback(
    @Headers('x-tenant-id') tenantId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const result = await this.paymentService.handleCallback(tenantId, PaymentProvider.UNIPAY, payload);
    return { status: result.success ? 'OK' : 'FAIL' };
  }

  /**
   * LINE Pay Confirm — 前端付款完成導回後呼叫此端點確認。
   */
  @Post('confirm/linepay')
  confirmLinePay(
    @Request() req: { user: JwtPayload },
    @Body() dto: {
      transactionId: string;
      orderId: string;
      amount: number;
    },
  ) {
    return this.paymentService.confirmLinePay(
      req.user.tenantId,
      dto.transactionId,
      dto.orderId,
      dto.amount,
    );
  }

  /** 退款 */
  @Post(':transactionId/refund')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.FINANCE)
  refund(
    @Param('transactionId') transactionId: string,
    @Body() dto: { amount?: number },
    @Request() req: { user: JwtPayload },
  ) {
    return this.paymentService.refund(req.user.tenantId, transactionId, dto.amount);
  }

  /** 查詢訂單的交易記錄 */
  @Get()
  findTransactions(
    @Request() req: { user: JwtPayload },
    @Query('orderId') orderId?: string,
  ) {
    return this.paymentService.findTransactions(req.user.tenantId, orderId);
  }

  // ── 金流設定管理（Admin） ──

  /** 設定金流商 API key */
  @Post('config')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  saveConfig(
    @Request() req: { user: JwtPayload },
    @Body() dto: {
      provider: PaymentProvider;
      config: Record<string, string>;
      isSandbox?: boolean;
    },
  ) {
    return this.paymentService.saveConfig(
      req.user.tenantId,
      dto.provider,
      dto.config,
      dto.isSandbox ?? true,
    );
  }

  /** 查看金流設定狀態（不回傳 API key） */
  @Get('config')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  getConfigStatus(@Request() req: { user: JwtPayload }) {
    return this.paymentService.getConfigStatus(req.user.tenantId);
  }
}
