import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostEntry } from './entities/cost-entry.entity';
import { CostsService } from './costs.service';
import { CostsController } from './costs.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CostEntry]),
    ProjectsModule,
  ],
  controllers: [CostsController],
  providers: [CostsService],
  exports: [CostsService],
})
export class CostsModule {}
