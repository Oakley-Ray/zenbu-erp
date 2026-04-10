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
import { ReturnsService } from './returns.service';
import { CreateReturnDto, CreateClaimDto } from './dto/create-return.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, ClaimStatus } from '@layerframe/shared-types';

@Controller('procurement')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  // ─── 退貨 ───

  @Post('returns')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT, TenantRole.WAREHOUSE)
  createReturn(
    @Body() dto: CreateReturnDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.returnsService.createReturn(req.user.tenantId, dto, req.user.sub);
  }

  @Get('returns')
  findAllReturns(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.returnsService.findAllReturns(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      supplierId,
    });
  }

  @Get('returns/:id')
  findReturnById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.returnsService.findReturnById(req.user.tenantId, id);
  }

  @Patch('returns/:id/status')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  updateReturnStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { status: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.returnsService.updateReturnStatus(req.user.tenantId, id, dto.status);
  }

  // ─── 索賠 ───

  @Post('claims')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  createClaim(
    @Body() dto: CreateClaimDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.returnsService.createClaim(req.user.tenantId, dto, req.user.sub);
  }

  @Get('claims')
  findAllClaims(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: ClaimStatus,
  ) {
    return this.returnsService.findAllClaims(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      supplierId,
      status,
    });
  }

  @Get('claims/:id')
  findClaimById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.returnsService.findClaimById(req.user.tenantId, id);
  }

  @Patch('claims/:id/status')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT, TenantRole.FINANCE)
  updateClaimStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { status: ClaimStatus; supplierResponse?: string; settledAmount?: number; offsetReference?: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.returnsService.updateClaimStatus(req.user.tenantId, id, dto.status, dto);
  }
}
