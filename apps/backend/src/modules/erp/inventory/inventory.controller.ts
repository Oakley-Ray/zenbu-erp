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
import { InventoryService } from './inventory.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload } from '@layerframe/shared-types';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /** 列出所有庫存 */
  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('warehouse') warehouse?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
  ) {
    return this.inventoryService.findAll(req.user.tenantId, {
      warehouse,
      lowStockOnly: lowStockOnly === 'true',
    });
  }

  /** 查看單一產品庫存 */
  @Get(':productId')
  getStock(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req: { user: JwtPayload },
    @Query('warehouse') warehouse?: string,
  ) {
    return this.inventoryService.getStock(req.user.tenantId, productId, warehouse);
  }

  /** 進貨 */
  @Post(':productId/in')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.WAREHOUSE)
  stockIn(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: { quantity: number; warehouse?: string; note?: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.inventoryService.stockIn(req.user.tenantId, productId, dto.quantity, {
      warehouse: dto.warehouse,
      note: dto.note,
      operatorId: req.user.sub,
    });
  }

  /** 手動調整庫存 */
  @Post(':productId/adjust')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.WAREHOUSE)
  adjust(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: { quantity: number; warehouse?: string; note?: string },
    @Request() req: { user: JwtPayload },
  ) {
    // 正數 = 增加，負數 = 減少
    if (dto.quantity > 0) {
      return this.inventoryService.stockIn(req.user.tenantId, productId, dto.quantity, {
        warehouse: dto.warehouse,
        note: dto.note ?? '手動調整',
        operatorId: req.user.sub,
      });
    }
    return this.inventoryService.stockOut(req.user.tenantId, productId, Math.abs(dto.quantity), {
      warehouse: dto.warehouse,
      note: dto.note ?? '手動調整',
      operatorId: req.user.sub,
    });
  }

  /** 設定安全庫存量 */
  @Patch(':productId/safety-stock')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.WAREHOUSE)
  setSafetyStock(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: { safetyStock: number; warehouse?: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.inventoryService.setSafetyStock(
      req.user.tenantId,
      productId,
      dto.safetyStock,
      dto.warehouse,
    );
  }

  /** 查看異動記錄 */
  @Get(':productId/movements')
  getMovements(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req: { user: JwtPayload },
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getMovements(
      req.user.tenantId,
      productId,
      limit ? Number(limit) : undefined,
    );
  }
}
