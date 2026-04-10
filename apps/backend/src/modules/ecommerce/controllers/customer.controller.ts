import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CustomerService } from '../customer.service';
import { TenantRole, JwtPayload } from '@layerframe/shared-types';
import { CustomerAddress } from '../customer.entity';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  /** 顧客自助註冊 — 公開路由 */
  @Public()
  @Post('register')
  register(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: { email: string; name: string; password?: string; phone?: string },
  ) {
    return this.customerService.register(tenantId, dto);
  }

  /** 後台：列出所有顧客 */
  @Get()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.SALES)
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customerService.findAll(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /** 後台：取得顧客詳情 */
  @Get(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.SALES)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.customerService.findById(req.user.tenantId, id);
  }

  /** 後台：更新顧客 */
  @Patch(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; phone?: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.customerService.update(req.user.tenantId, id, dto);
  }

  /** 新增收件地址 */
  @Post(':id/addresses')
  addAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Omit<CustomerAddress, 'id'>,
    @Request() req: { user: JwtPayload },
  ) {
    return this.customerService.addAddress(req.user.tenantId, id, dto);
  }

  /** 刪除收件地址 */
  @Delete(':id/addresses/:addressId')
  removeAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId') addressId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.customerService.removeAddress(req.user.tenantId, id, addressId);
  }
}
