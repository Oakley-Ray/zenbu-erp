import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';
import { CostCategory } from '@layerframe/shared-types';

export class CreateCostDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsEnum(CostCategory)
  category!: CostCategory;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  date!: string;
}
