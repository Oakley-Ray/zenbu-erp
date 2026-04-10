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
import { GoodsReceiptService } from './goods-receipt.service';
import { CreateGrDto } from './dto/create-gr.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, GoodsReceiptStatus, InspectionResult } from '@layerframe/shared-types';

@Controller('procurement/goods-receipts')
export class GoodsReceiptController {
  constructor(private readonly grService: GoodsReceiptService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT, TenantRole.WAREHOUSE)
  create(
    @Body() dto: CreateGrDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.grService.create(req.user.tenantId, dto, req.user.sub);
  }

  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('purchaseOrderId') purchaseOrderId?: string,
    @Query('status') status?: GoodsReceiptStatus,
  ) {
    return this.grService.findAll(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      purchaseOrderId,
      status,
    });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.grService.findById(req.user.tenantId, id);
  }

  /** 完成收貨 */
  @Patch(':id/complete')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT, TenantRole.WAREHOUSE)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.grService.complete(req.user.tenantId, id);
  }

  /** 更新品檢結果 */
  @Patch(':grId/items/:itemId/inspection')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT, TenantRole.WAREHOUSE)
  updateInspection(
    @Param('grId', ParseUUIDPipe) grId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: {
      inspectionResult: InspectionResult;
      acceptedQty: number;
      rejectedQty: number;
      disposition?: string;
      inspectionDetails?: any;
      specialAcceptApprovedBy?: string;
    },
    @Request() req: { user: JwtPayload },
  ) {
    return this.grService.updateInspection(req.user.tenantId, grId, itemId, dto);
  }
}
