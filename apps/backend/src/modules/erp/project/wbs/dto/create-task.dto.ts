import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsUUID,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class CreateTaskDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedCost?: number;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  dependencies?: string[];
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @IsOptional()
  @IsDateString()
  actualStartDate?: string;

  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  dependencies?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
