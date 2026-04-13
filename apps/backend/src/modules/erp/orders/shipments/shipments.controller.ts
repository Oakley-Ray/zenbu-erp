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
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, ShipmentStatus } from '@layerframe/shared-types';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.WAREHOUSE, TenantRole.SALES)
  create(
    @Body() dto: CreateShipmentDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.shipmentsService.create(req.user.tenantId, dto, req.user.sub);
  }

  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ShipmentStatus,
  ) {
    return this.shipmentsService.findAll(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  /** 查詢某訂單的所有出貨單 */
  @Get('by-order/:orderId')
  findByOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.shipmentsService.findByOrder(req.user.tenantId, orderId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.shipmentsService.findById(req.user.tenantId, id);
  }

  @Patch(':id/status')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.WAREHOUSE)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { status: ShipmentStatus },
    @Request() req: { user: JwtPayload },
  ) {
    return this.shipmentsService.updateStatus(req.user.tenantId, id, dto.status);
  }

  @Patch(':id/tracking')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.WAREHOUSE)
  updateTracking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { trackingNumber: string; trackingUrl?: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.shipmentsService.updateTracking(req.user.tenantId, id, dto.trackingNumber, dto.trackingUrl);
  }
}
