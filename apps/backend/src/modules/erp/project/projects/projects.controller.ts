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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, ProjectStatus } from '@layerframe/shared-types';

@Controller('project/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  create(
    @Body() dto: CreateProjectDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.projectsService.create(req.user.tenantId, dto, req.user.sub);
  }

  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.projectsService.findAll(req.user.tenantId, {
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
    return this.projectsService.findById(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.projectsService.update(req.user.tenantId, id, dto);
  }

  @Patch(':id/status')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { status: ProjectStatus },
    @Request() req: { user: JwtPayload },
  ) {
    return this.projectsService.updateStatus(req.user.tenantId, id, dto.status);
  }

  @Delete(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.projectsService.delete(req.user.tenantId, id);
  }
}
