import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, SupplierStatus } from '@layerframe/shared-types';

@Controller('procurement/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  create(
    @Body() dto: CreateSupplierDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.suppliersService.create(req.user.tenantId, dto);
  }

  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SupplierStatus,
    @Query('search') search?: string,
  ) {
    return this.suppliersService.findAll(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      search,
    });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.suppliersService.findById(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.suppliersService.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.suppliersService.delete(req.user.tenantId, id);
  }

  // ─── 合約 ───

  @Post(':id/contracts')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  createContract(
    @Param('id', ParseUUIDPipe) supplierId: string,
    @Body() data: Partial<Record<string, unknown>>,
    @Request() req: { user: JwtPayload },
  ) {
    return this.suppliersService.createContract(req.user.tenantId, supplierId, data as any);
  }

  @Get(':id/contracts')
  findContracts(
    @Param('id', ParseUUIDPipe) supplierId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.suppliersService.findContracts(req.user.tenantId, supplierId);
  }

  @Delete('contracts/:contractId')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  removeContract(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.suppliersService.deleteContract(req.user.tenantId, contractId);
  }
}
