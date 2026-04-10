import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateCarrierDto, UpdateCarrierDto } from './dto/carrier.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, QuoteStatus } from '@layerframe/shared-types';

@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  // ── Carriers 物流商 ──

  @Post('carriers')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  createCarrier(
    @Body() dto: CreateCarrierDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.logisticsService.createCarrier(req.user.tenantId, dto);
  }

  @Get('carriers')
  findAllCarriers(@Request() req: { user: JwtPayload }) {
    return this.logisticsService.findAllCarriers(req.user.tenantId);
  }

  @Get('carriers/:id')
  findCarrier(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.logisticsService.findCarrierById(req.user.tenantId, id);
  }

  @Patch('carriers/:id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  updateCarrier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarrierDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.logisticsService.updateCarrier(req.user.tenantId, id, dto);
  }

  // ── Quotes 報價單 ──

  /** 建立報價單 — 自動比價所有物流商 */
  @Post('quotes')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.SALES)
  createQuote(
    @Body() dto: CreateQuoteDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.logisticsService.createQuote(req.user.tenantId, dto, req.user.sub);
  }

  @Get('quotes')
  findAllQuotes(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: QuoteStatus,
  ) {
    return this.logisticsService.findAllQuotes(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get('quotes/:id')
  findQuote(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.logisticsService.findQuoteById(req.user.tenantId, id);
  }

  /** 選定物流商 — 確認某一家的報價 */
  @Patch('quotes/:id/select-carrier')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.SALES)
  selectCarrier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { carrierId: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.logisticsService.selectCarrier(req.user.tenantId, id, dto.carrierId);
  }

  /** 重新比價 */
  @Post('quotes/:id/requote')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.SALES)
  requote(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.logisticsService.requote(req.user.tenantId, id);
  }

  /** 更新報價單狀態 */
  @Patch('quotes/:id/status')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.SALES)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { status: QuoteStatus },
    @Request() req: { user: JwtPayload },
  ) {
    return this.logisticsService.updateQuoteStatus(req.user.tenantId, id, dto.status);
  }
}
