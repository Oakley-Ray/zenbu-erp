import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { CostsService } from './costs.service';
import { CreateCostDto } from './dto/create-cost.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload } from '@layerframe/shared-types';

@Controller('project/costs')
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER, TenantRole.FINANCE)
  create(
    @Body() dto: CreateCostDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.costsService.create(req.user.tenantId, dto, req.user.sub);
  }

  @Get()
  findByProject(
    @Request() req: { user: JwtPayload },
    @Query('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.costsService.findByProject(req.user.tenantId, projectId);
  }

  @Get('summary')
  getSummary(
    @Request() req: { user: JwtPayload },
    @Query('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.costsService.getSummary(req.user.tenantId, projectId);
  }

  @Delete(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.costsService.delete(req.user.tenantId, id);
  }
}
