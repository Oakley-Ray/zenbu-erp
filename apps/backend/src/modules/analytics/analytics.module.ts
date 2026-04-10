import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailySalesSnapshot } from './daily-snapshot.entity';
import { ProductRanking } from './product-ranking.entity';
import { CustomerRanking } from './customer-ranking.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailySalesSnapshot, ProductRanking, CustomerRanking]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
