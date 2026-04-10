import { Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { PlatformRole } from '@layerframe/shared-types';

/** 租戶管理 — 僅 platform_owner 可操作 */
@Controller('tenants')
@Roles(PlatformRole.PLATFORM_OWNER)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: { name: string; slug: string; customDomain?: string }) {
    return this.tenantsService.create(dto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Record<string, unknown>) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.deactivate(id);
  }
}
