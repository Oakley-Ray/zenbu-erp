import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrier } from './carrier.entity';
import { Quote } from './quote.entity';
import { QuoteItem } from './quote-item.entity';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Carrier, Quote, QuoteItem])],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}
