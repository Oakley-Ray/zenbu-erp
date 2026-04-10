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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, OrderStatus, PaymentStatus } from '@layerframe/shared-types';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.SALES)
  create(
    @Body() dto: CreateOrderDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.ordersService.create(req.user.tenantId, dto, req.user.sub);
  }

  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAll(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.ordersService.findById(req.user.tenantId, id);
  }

  /** 更新訂單狀態 — 走狀態機 */
  @Patch(':id/status')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.SALES, TenantRole.WAREHOUSE)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { status: OrderStatus },
    @Request() req: { user: JwtPayload },
  ) {
    return this.ordersService.updateStatus(req.user.tenantId, id, dto.status);
  }

  /** 更新付款狀態（通常由金流 webhook 觸發） */
  @Patch(':id/payment')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.FINANCE)
  updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { paymentStatus: PaymentStatus },
    @Request() req: { user: JwtPayload },
  ) {
    return this.ordersService.updatePaymentStatus(req.user.tenantId, id, dto.paymentStatus);
  }
}
