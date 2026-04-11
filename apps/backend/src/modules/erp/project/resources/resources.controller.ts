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
import { ResourcesService } from './resources.service';
import { CreateResourceDto, AssignResourceDto } from './dto/assign-resource.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload } from '@layerframe/shared-types';

@Controller('project/resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  createResource(
    @Body() dto: CreateResourceDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.resourcesService.createResource(req.user.tenantId, dto);
  }

  @Get()
  findAllResources(@Request() req: { user: JwtPayload }) {
    return this.resourcesService.findAllResources(req.user.tenantId);
  }

  @Delete(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  deleteResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.resourcesService.deleteResource(req.user.tenantId, id);
  }

  @Post('assign')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  assignResource(
    @Body() dto: AssignResourceDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.resourcesService.assignResource(req.user.tenantId, dto);
  }

  @Get('assignments')
  findAssignments(
    @Request() req: { user: JwtPayload },
    @Query('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.resourcesService.findAssignmentsByTask(req.user.tenantId, taskId);
  }

  @Delete('assignments/:id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  removeAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.resourcesService.removeAssignment(req.user.tenantId, id);
  }
}
