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
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto/create-milestone.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload } from '@layerframe/shared-types';

@Controller('project/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  create(
    @Body() dto: CreateMilestoneDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.milestonesService.create(req.user.tenantId, dto);
  }

  @Get()
  findByProject(
    @Request() req: { user: JwtPayload },
    @Query('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.milestonesService.findByProject(req.user.tenantId, projectId);
  }

  @Patch(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMilestoneDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.milestonesService.update(req.user.tenantId, id, dto);
  }

  @Patch(':id/achieve')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  achieve(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.milestonesService.achieve(req.user.tenantId, id);
  }

  @Delete(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.milestonesService.delete(req.user.tenantId, id);
  }
}
