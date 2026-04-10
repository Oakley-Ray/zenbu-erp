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
import { RfqService } from './rfq.service';
import { CreateRfqDto, SubmitQuotationDto } from './dto/create-rfq.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, RfqStatus } from '@layerframe/shared-types';

@Controller('procurement/rfq')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  create(
    @Body() dto: CreateRfqDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rfqService.create(req.user.tenantId, dto, req.user.sub);
  }

  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: RfqStatus,
  ) {
    return this.rfqService.findAll(req.user.tenantId, {
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
    return this.rfqService.findById(req.user.tenantId, id);
  }

  /** 發送詢價 */
  @Patch(':id/send')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rfqService.send(req.user.tenantId, id);
  }

  /** 提交報價 */
  @Post(':id/quotations')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  submitQuotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitQuotationDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rfqService.submitQuotation(req.user.tenantId, id, dto);
  }

  /** 比價 */
  @Get(':id/compare')
  compare(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rfqService.compareQuotations(req.user.tenantId, id);
  }

  /** 決標 */
  @Patch(':id/award')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROCUREMENT)
  award(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { supplierId: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.rfqService.award(req.user.tenantId, id, dto.supplierId);
  }
}
