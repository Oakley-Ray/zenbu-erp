import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RfqRequest } from './entities/rfq-request.entity';
import { RfqItem } from './entities/rfq-item.entity';
import { RfqQuotation } from './entities/rfq-quotation.entity';
import { RfqService } from './rfq.service';
import { RfqController } from './rfq.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RfqRequest, RfqItem, RfqQuotation])],
  controllers: [RfqController],
  providers: [RfqService],
  exports: [RfqService],
})
export class RfqModule {}
