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
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePoDto } from './dto/create-po.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, PurchaseOrderStatus } from '@layerframe/shared-types';

@Controller('procurement/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  create(
    @Body() dto: CreatePoDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.poService.create(req.user.tenantId, dto, req.user.sub);
  }

  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PurchaseOrderStatus,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.poService.findAll(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      supplierId,
    });
  }

  @Get('overdue')
  getOverdue(@Request() req: { user: JwtPayload }) {
    return this.poService.getOverduePOs(req.user.tenantId);
  }

  @Get('upcoming')
  getUpcoming(
    @Request() req: { user: JwtPayload },
    @Query('days') days?: string,
  ) {
    return this.poService.getUpcomingDeliveries(req.user.tenantId, days ? Number(days) : 7);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.poService.findById(req.user.tenantId, id);
  }

  @Get(':id/amendments')
  getAmendments(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.poService.getAmendments(req.user.tenantId, id);
  }

  /** 送審 */
  @Patch(':id/submit')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.poService.submitForApproval(req.user.tenantId, id);
  }

  /** 審核通過 */
  @Patch(':id/approve')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { note?: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.poService.approve(req.user.tenantId, id, req.user.sub, dto.note);
  }

  /** 審核退回 */
  @Patch(':id/reject')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { note: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.poService.reject(req.user.tenantId, id, req.user.sub, dto.note);
  }

  /** 更新狀態 */
  @Patch(':id/status')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { status: PurchaseOrderStatus },
    @Request() req: { user: JwtPayload },
  ) {
    return this.poService.updateStatus(req.user.tenantId, id, dto.status);
  }

  /** 變更單 */
  @Post(':id/amend')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  amend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { updates: Partial<CreatePoDto>; changeDescription: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.poService.amend(
      req.user.tenantId,
      id,
      dto.updates,
      req.user.sub,
      dto.changeDescription,
    );
  }
}
