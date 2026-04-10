import {
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsString,
  IsEnum,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InspectionType, InspectionResult, DispositionType } from '@layerframe/shared-types';

export class CreateGrItemDto {
  @IsUUID()
  poItemId!: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  productName!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(0)
  orderedQty!: number;

  @IsNumber()
  @Min(0)
  receivedQty!: number;

  @IsOptional()
  @IsEnum(InspectionType)
  inspectionType?: InspectionType;

  @IsOptional()
  @IsEnum(InspectionResult)
  inspectionResult?: InspectionResult;

  @IsOptional()
  inspectionDetails?: {
    items: Array<{
      name: string;
      standard: string;
      actual: string;
      pass: boolean;
    }>;
  };

  @IsOptional()
  @IsNumber()
  @Min(0)
  acceptedQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQty?: number;

  @IsOptional()
  @IsEnum(DispositionType)
  disposition?: DispositionType;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateGrDto {
  @IsUUID()
  purchaseOrderId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGrItemDto)
  items!: CreateGrItemDto[];

  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overReceiveTolerance?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
