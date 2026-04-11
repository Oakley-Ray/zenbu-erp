import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';
import { ResourceType } from '@layerframe/shared-types';

export class CreateResourceDto {
  @IsString()
  name!: string;

  @IsEnum(ResourceType)
  type!: ResourceType;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class AssignResourceDto {
  @IsUUID()
  taskId!: string;

  @IsUUID()
  resourceId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
