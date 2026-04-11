import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WbsTask } from './entities/wbs-task.entity';
import { WbsService } from './wbs.service';
import { WbsController } from './wbs.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WbsTask]),
    ProjectsModule,
  ],
  controllers: [WbsController],
  providers: [WbsService],
  exports: [WbsService],
})
export class WbsModule {}
