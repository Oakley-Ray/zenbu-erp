import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { WbsModule } from './wbs/wbs.module';
import { ResourcesModule } from './resources/resources.module';
import { MilestonesModule } from './milestones/milestones.module';
import { CostsModule } from './costs/costs.module';

/**
 * 專案管理根模組
 * 整合專案、WBS、資源、里程碑、成本管理
 */
@Module({
  imports: [
    ProjectsModule,
    WbsModule,
    ResourcesModule,
    MilestonesModule,
    CostsModule,
  ],
  exports: [
    ProjectsModule,
    WbsModule,
    ResourcesModule,
    MilestonesModule,
    CostsModule,
  ],
})
export class ProjectModule {}
