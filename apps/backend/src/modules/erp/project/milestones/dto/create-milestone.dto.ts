import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class DeliverableDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class CreateMilestoneDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliverableDto)
  deliverables?: DeliverableDto[];
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliverableDto)
  deliverables?: DeliverableDto[];
}
