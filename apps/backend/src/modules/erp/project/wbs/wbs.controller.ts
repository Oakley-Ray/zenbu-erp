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
import { WbsService } from './wbs.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload, TaskStatus } from '@layerframe/shared-types';

@Controller('project/tasks')
export class WbsController {
  constructor(private readonly wbsService: WbsService) {}

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  create(
    @Body() dto: CreateTaskDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.wbsService.create(req.user.tenantId, dto);
  }

  @Get()
  findByProject(
    @Request() req: { user: JwtPayload },
    @Query('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.wbsService.findByProject(req.user.tenantId, projectId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.wbsService.findById(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.wbsService.update(req.user.tenantId, id, dto);
  }

  @Patch(':id/status')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { status: TaskStatus },
    @Request() req: { user: JwtPayload },
  ) {
    return this.wbsService.updateStatus(req.user.tenantId, id, dto.status);
  }

  @Delete(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.PROJECT_MANAGER)
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.wbsService.delete(req.user.tenantId, id);
  }
}
